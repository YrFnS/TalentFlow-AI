// @ts-nocheck
"use client";

import React, { useState, useCallback } from "react";
import { useI18n } from "@/store/i18n-store";
import { toast } from "sonner";

import ProfileHeader from "./components/ProfileHeader";
import ResumeUploadCard from "./components/ResumeUploadCard";
import ProfileCompletenessCard from "./components/ProfileCompletenessCard";
import PersonalInfoCard from "./components/PersonalInfoCard";
import SkillsCard from "./components/SkillsCard";
import ExperienceCard from "./components/ExperienceCard";
import EducationCard from "./components/EducationCard";
import CertificationCard from "./components/CertificationCard";

interface ExperienceItem {
	id: string;
	title: string;
	company: string;
	description: string;
	startDate: string;
	endDate: string;
	current: boolean;
}

interface EducationItem {
	id: string;
	institution: string;
	degree: string;
	field: string;
	startDate: string;
	endDate: string;
}

interface CertificationItem {
	id: string;
	name: string;
	issuer: string;
	date: string;
}

interface PersonalInfo {
	name: string;
	email: string;
	phone: string;
	location: string;
	bio: string;
	currentTitle: string;
	linkedin: string;
	portfolio: string;
	availability: string;
	expectedSalary: string;
}

export default function ProfilePage() {
	const { t } = useI18n();

	const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
		name: "",
		email: "",
		phone: "",
		location: "",
		bio: "",
		currentTitle: "",
		linkedin: "",
		portfolio: "",
		availability: "open",
		expectedSalary: "",
	});

	const [isPublic, setIsPublic] = useState(true);
	const [skills, setSkills] = useState<string[]>([]);
	const [newSkill, setNewSkill] = useState("");

	const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
	const [educations, setEducations] = useState<EducationItem[]>([]);
	const [certifications, setCertifications] = useState<CertificationItem[]>([]);

	// Dialog states
	const [expDialogOpen, setExpDialogOpen] = useState(false);
	const [eduDialogOpen, setEduDialogOpen] = useState(false);
	const [certDialogOpen, setCertDialogOpen] = useState(false);
	const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
	const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
	const [editingCert, setEditingCert] = useState<CertificationItem | null>(
		null,
	);

	// Form states
	const [expForm, setExpForm] = useState<Partial<ExperienceItem>>({});
	const [eduForm, setEduForm] = useState<Partial<EducationItem>>({});
	const [certForm, setCertForm] = useState<Partial<CertificationItem>>({});

	// Profile completeness
	const profileCompleteness = (() => {
		let score = 0;
		const total = 8;
		if (personalInfo.name) score++;
		if (personalInfo.phone) score++;
		if (personalInfo.location) score++;
		if (personalInfo.bio) score++;
		if (experiences.length > 0) score++;
		if (educations.length > 0) score++;
		if (skills.length > 0) score++;
		if (certifications.length > 0) score++;
		return Math.round((score / total) * 100);
	})();

	const addSkill = useCallback(() => {
		if (newSkill.trim() && !skills.includes(newSkill.trim())) {
			setSkills([...skills, newSkill.trim()]);
			setNewSkill("");
		}
	}, [newSkill, skills]);

	const removeSkill = useCallback(
		(skill: string) => {
			setSkills(skills.filter((s) => s !== skill));
		},
		[skills],
	);

	const openExpDialog = (exp?: ExperienceItem) => {
		if (exp) {
			setEditingExp(exp);
			setExpForm(exp);
		} else {
			setEditingExp(null);
			setExpForm({
				title: "",
				company: "",
				description: "",
				startDate: "",
				endDate: "",
				current: false,
			});
		}
		setExpDialogOpen(true);
	};

	const saveExp = () => {
		if (editingExp) {
			setExperiences(
				experiences.map((e) =>
					e.id === editingExp.id ? ({ ...e, ...expForm } as ExperienceItem) : e,
				),
			);
		} else {
			setExperiences([
				...experiences,
				{ ...expForm, id: Date.now().toString() } as ExperienceItem,
			]);
		}
		setExpDialogOpen(false);
		toast.success("Experience saved");
	};

	const deleteExp = (id: string) =>
		setExperiences(experiences.filter((e) => e.id !== id));

	const openEduDialog = (edu?: EducationItem) => {
		if (edu) {
			setEditingEdu(edu);
			setEduForm(edu);
		} else {
			setEditingEdu(null);
			setEduForm({
				institution: "",
				degree: "",
				field: "",
				startDate: "",
				endDate: "",
			});
		}
		setEduDialogOpen(true);
	};

	const saveEdu = () => {
		if (editingEdu) {
			setEducations(
				educations.map((e) =>
					e.id === editingEdu.id ? ({ ...e, ...eduForm } as EducationItem) : e,
				),
			);
		} else {
			setEducations([
				...educations,
				{ ...eduForm, id: Date.now().toString() } as EducationItem,
			]);
		}
		setEduDialogOpen(false);
		toast.success("Education saved");
	};

	const deleteEdu = (id: string) =>
		setEducations(educations.filter((e) => e.id !== id));

	const openCertDialog = (cert?: CertificationItem) => {
		if (cert) {
			setEditingCert(cert);
			setCertForm(cert);
		} else {
			setEditingCert(null);
			setCertForm({ name: "", issuer: "", date: "" });
		}
		setCertDialogOpen(true);
	};

	const saveCert = () => {
		if (editingCert) {
			setCertifications(
				certifications.map((c) =>
					c.id === editingCert.id
						? ({ ...c, ...certForm } as CertificationItem)
						: c,
				),
			);
		} else {
			setCertifications([
				...certifications,
				{ ...certForm, id: Date.now().toString() } as CertificationItem,
			]);
		}
		setCertDialogOpen(false);
		toast.success("Certification saved");
	};

	const deleteCert = (id: string) =>
		setCertifications(certifications.filter((c) => c.id !== id));

	const handleAiAnalyze = () => {
		toast.info("AI Resume Analysis coming soon");
	};

	return (
		<div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<ProfileHeader
				onAiAnalyze={handleAiAnalyze}
				onSave={() => toast.success("Profile saved")}
			/>

			{/* Resume Upload */}
			<ResumeUploadCard
				personalInfo={personalInfo}
				setPersonalInfo={setPersonalInfo}
				skills={skills}
				setSkills={setSkills}
				setExperiences={setExperiences}
				setEducations={setEducations}
				setCertifications={setCertifications}
			/>

			{/* Profile Completeness */}
			<ProfileCompletenessCard
				profileCompleteness={profileCompleteness}
				personalInfo={personalInfo}
				experiencesLength={experiences.length}
				educationsLength={educations.length}
				skillsLength={skills.length}
				certificationsLength={certifications.length}
				isPublic={isPublic}
				setIsPublic={setIsPublic}
			/>

			{/* Personal Information */}
			<PersonalInfoCard
				personalInfo={personalInfo}
				setPersonalInfo={setPersonalInfo}
			/>

			{/* Skills */}
			<SkillsCard
				skills={skills}
				newSkill={newSkill}
				setNewSkill={setNewSkill}
				addSkill={addSkill}
				removeSkill={removeSkill}
			/>

			{/* Experience */}
			<ExperienceCard
				experiences={experiences}
				expDialogOpen={expDialogOpen}
				setExpDialogOpen={setExpDialogOpen}
				editingExp={editingExp}
				expForm={expForm}
				setExpForm={setExpForm}
				openExpDialog={openExpDialog}
				saveExp={saveExp}
				deleteExp={deleteExp}
			/>

			{/* Education */}
			<EducationCard
				educations={educations}
				eduDialogOpen={eduDialogOpen}
				setEduDialogOpen={setEduDialogOpen}
				editingEdu={editingEdu}
				eduForm={eduForm}
				setEduForm={setEduForm}
				openEduDialog={openEduDialog}
				saveEdu={saveEdu}
				deleteEdu={deleteEdu}
			/>

			{/* Certifications */}
			<CertificationCard
				certifications={certifications}
				certDialogOpen={certDialogOpen}
				setCertDialogOpen={setCertDialogOpen}
				editingCert={editingCert}
				certForm={certForm}
				setCertForm={setCertForm}
				openCertDialog={openCertDialog}
				saveCert={saveCert}
				deleteCert={deleteCert}
			/>
		</div>
	);
}
