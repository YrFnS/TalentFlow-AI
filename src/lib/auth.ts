import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { TOTP } from "@otplib/totp";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { db } from "@/lib/db";
import { logAuthEvent } from "@/lib/security/auth-logger";
import { decrypt } from "@/lib/security/encryption";

const totp = new TOTP({
	crypto: new NobleCryptoPlugin(),
	base32: new ScureBase32Plugin(),
});

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(db),

	// Secure cookie configuration
	cookies: {
		sessionToken: {
			name: `__Secure-next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		callbackUrl: {
			name: `__Host-next-auth.callback-url`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		csrfToken: {
			name: `__Host-next-auth.csrf-token`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
	},
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),
		LinkedInProvider({
			clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
			clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
				totpToken: { label: "2FA Token", type: "text" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Email and password are required");
				}

				const user = await db.user.findUnique({
					where: { email: credentials.email },
					include: {
						companyMemberships: {
							include: { company: true },
							take: 1,
						},
					},
				});

				if (!user || !user.password) {
					// Log failed login — user not found
					await logAuthEvent({
						eventType: "LOGIN_FAILURE",
						details: { email: credentials.email, reason: "user_not_found" },
					});
					throw new Error("Invalid email or password");
				}

				const isValid = await bcrypt.compare(
					credentials.password,
					user.password,
				);
				if (!isValid) {
					// Log failed login — wrong password
					await logAuthEvent({
						eventType: "LOGIN_FAILURE",
						userId: user.id,
						details: { email: credentials.email, reason: "invalid_password" },
					});
					throw new Error("Invalid email or password");
				}

				if (!user.isActive) {
					// Log failed login — account deactivated
					await logAuthEvent({
						eventType: "LOGIN_FAILURE",
						userId: user.id,
						details: {
							email: credentials.email,
							reason: "account_deactivated",
						},
					});
					throw new Error("Account is deactivated");
				}

				// 2FA check: if enabled, require TOTP token
				if (user.twoFactorEnabled) {
					const totpToken = (credentials as any).totpToken;

					if (!totpToken) {
						// Signal to the frontend that 2FA is required
						throw new Error(`2FA_REQUIRED:${user.id}`);
					}

					// Verify TOTP token against stored secret
					if (user.twoFactorSecret) {
						try {
							const decryptedSecret = decrypt(user.twoFactorSecret);
							const totpResult = await totp.verify(totpToken, {
								secret: decryptedSecret,
							});

							if (totpResult.valid) {
								// Log successful 2FA login
								await logAuthEvent({
									eventType: "LOGIN_SUCCESS",
									userId: user.id,
									details: {
										email: credentials.email,
										provider: "credentials",
										method: "2fa_totp",
									},
								});

								const company = user.companyMemberships[0]?.company;
								return {
									id: user.id,
									email: user.email,
									name: user.name,
									role: user.role,
									image: user.image,
									companyId: company?.id,
									companyName: company?.name,
									locale: user.locale,
								};
							}
						} catch (decryptError) {
							// Decryption failed, try backup codes below
						}
					}

					// TOTP failed — try backup codes
					if (user.backupCodes) {
						try {
							const hashedBackupCodes: string[] = JSON.parse(user.backupCodes);
							for (let i = 0; i < hashedBackupCodes.length; i++) {
								const isMatch = await bcrypt.compare(
									totpToken,
									hashedBackupCodes[i],
								);
								if (isMatch) {
									// Remove used backup code
									hashedBackupCodes.splice(i, 1);
									await db.user.update({
										where: { id: user.id },
										data: {
											backupCodes:
												hashedBackupCodes.length > 0
													? JSON.stringify(hashedBackupCodes)
													: null,
										},
									});

									// Log successful 2FA login with backup code
									await logAuthEvent({
										eventType: "LOGIN_SUCCESS",
										userId: user.id,
										details: {
											email: credentials.email,
											provider: "credentials",
											method: "2fa_backup_code",
										},
									});

									const company = user.companyMemberships[0]?.company;
									return {
										id: user.id,
										email: user.email,
										name: user.name,
										role: user.role,
										image: user.image,
										companyId: company?.id,
										companyName: company?.name,
										locale: user.locale,
									};
								}
							}
						} catch {
							// Backup code parsing failed
						}
					}

					// Both TOTP and backup code failed
					await logAuthEvent({
						eventType: "LOGIN_FAILURE",
						userId: user.id,
						details: { email: credentials.email, reason: "invalid_2fa_token" },
					});
					throw new Error("Invalid authentication code");
				}

				// Log successful credential login (no 2FA)
				await logAuthEvent({
					eventType: "LOGIN_SUCCESS",
					userId: user.id,
					details: { email: credentials.email, provider: "credentials" },
				});

				const company = user.companyMemberships[0]?.company;

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
					image: user.image,
					companyId: company?.id,
					companyName: company?.name,
					locale: user.locale,
				};
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60, // 24 hours
	},
	jwt: {
		maxAge: 24 * 60 * 60, // 24 hours
	},
	callbacks: {
		async signIn({ user, account }) {
			// Link social accounts to existing users by email
			if (account?.provider === "google" || account?.provider === "linkedin") {
				if (user.email) {
					const existingUser = await db.user.findUnique({
						where: { email: user.email },
						include: {
							companyMemberships: {
								include: { company: true },
								take: 1,
							},
						},
					});

					if (existingUser) {
						// User exists – ensure the OAuth account is linked
						const existingAccount = await db.account.findFirst({
							where: {
								userId: existingUser.id,
								provider: account.provider,
								providerAccountId: account.providerAccountId,
							},
						});

						if (!existingAccount) {
							await db.account.create({
								data: {
									userId: existingUser.id,
									type: account.type,
									provider: account.provider,
									providerAccountId: account.providerAccountId,
									access_token: account.access_token,
									refresh_token: account.refresh_token,
									expires_at: account.expires_at,
									token_type: account.token_type,
									scope: account.scope,
									id_token: account.id_token,
									session_state: account.session_state,
								},
							});
						}

						// Update user info from OAuth profile if missing
						if (!existingUser.name && user.name) {
							await db.user.update({
								where: { id: existingUser.id },
								data: { name: user.name },
							});
						}
						if (!existingUser.image && user.image) {
							await db.user.update({
								where: { id: existingUser.id },
								data: { image: user.image },
							});
						}

						// Log social login for existing user
						await logAuthEvent({
							eventType: "SOCIAL_LOGIN",
							userId: existingUser.id,
							details: {
								email: user.email,
								provider: account.provider,
								isNewUser: false,
							},
						});
					} else {
						// New user – create with default CANDIDATE role
						// PrismaAdapter handles user creation, but we need to set the role
						const newUser = await db.user.upsert({
							where: { email: user.email },
							update: {},
							create: {
								email: user.email,
								name: user.name || user.email.split("@")[0],
								image: user.image,
								role: "CANDIDATE",
							},
						});

						// Link the account to the new user
						await db.account.upsert({
							where: {
								provider_providerAccountId: {
									provider: account.provider,
									providerAccountId: account.providerAccountId,
								},
							},
							update: {},
							create: {
								userId: newUser.id,
								type: account.type,
								provider: account.provider,
								providerAccountId: account.providerAccountId,
								access_token: account.access_token,
								refresh_token: account.refresh_token,
								expires_at: account.expires_at,
								token_type: account.token_type,
								scope: account.scope,
								id_token: account.id_token,
								session_state: account.session_state,
							},
						});

						// Log social login for new user
						await logAuthEvent({
							eventType: "SOCIAL_LOGIN",
							userId: newUser.id,
							details: {
								email: user.email,
								provider: account.provider,
								isNewUser: true,
							},
						});
					}
				}
			}
			return true;
		},
		async jwt({ token, user, account, trigger }) {
			if (user) {
				// For OAuth logins, fetch user data from DB to include role/company
				if (
					account?.provider === "google" ||
					account?.provider === "linkedin"
				) {
					const dbUser = await db.user.findUnique({
						where: { email: user.email! },
						include: {
							companyMemberships: {
								include: { company: true },
								take: 1,
							},
						},
					});

					if (dbUser) {
						token.sub = dbUser.id;
						token.role = dbUser.role;
						const company = dbUser.companyMemberships[0]?.company;
						token.companyId = company?.id;
						token.companyName = company?.name;
						token.locale = dbUser.locale;
					}
				} else {
					token.role = (user as any).role;
					token.companyId = (user as any).companyId;
					token.companyName = (user as any).companyName;
					token.locale = (user as any).locale;
				}
			}

			// On session update/refresh, verify user is still active
			if (trigger === "update" || trigger === "signIn") {
				try {
					const dbUser = await db.user.findUnique({
						where: { id: token.sub },
						select: { isActive: true, role: true },
					});

					if (!dbUser || !dbUser.isActive) {
						// User has been deactivated - force re-auth
						return { ...token, error: "UserDeactivated" };
					}

					// Update role in case it changed
					token.role = dbUser.role;
				} catch {
					// Database error - don't block, keep existing token
				}
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as any).id = token.sub;
				(session.user as any).role = token.role;
				(session.user as any).companyId = token.companyId;
				(session.user as any).companyName = token.companyName;
				(session.user as any).locale = token.locale;

				// Propagate error from JWT (e.g., UserDeactivated)
				if ((token as any).error) {
					(session as any).error = (token as any).error;
				}
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/login",
		error: "/auth/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
