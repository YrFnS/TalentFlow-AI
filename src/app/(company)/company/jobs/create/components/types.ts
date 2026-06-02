// @ts-nocheck

export interface ScreeningQuestion {
	question: string;
	questionType: "YES_NO" | "MULTIPLE_CHOICE" | "TEXT" | "NUMBER" | "DATE";
	options: string[];
	isRequired: boolean;
	isKnockout: boolean;
	knockoutAnswer: string;
}

export interface JobForm {
	title: string;
	description: string;
	requirements: string[];
	responsibilities: string[];
	benefits: string[];
	jobType: string;
	location: string;
	isRemote: boolean;
	salaryMin: string;
	salaryMax: string;
	salaryCurrency: string;
	experienceMin: string;
	experienceMax: string;
	skills: string[];
	openings: string;
	deadline: string;
}

export interface AiForm {
	title: string;
	department: string;
	level: string;
	requirements: string;
}

export const createEmptyQuestion = (): ScreeningQuestion => ({
	question: "",
	questionType: "YES_NO",
	options: [],
	isRequired: true,
	isKnockout: false,
	knockoutAnswer: "",
});

export const jobTypeOptions = [
	{ value: "FULL_TIME", label: "Full Time" },
	{ value: "PART_TIME", label: "Part Time" },
	{ value: "CONTRACT", label: "Contract" },
	{ value: "INTERNSHIP", label: "Internship" },
	{ value: "REMOTE", label: "Remote" },
	{ value: "HYBRID", label: "Hybrid" },
];

export const currencyOptions = [
	{ value: "USD", label: "USD ($)" },
	{ value: "EUR", label: "EUR (€)" },
	{ value: "GBP", label: "GBP (£)" },
	{ value: "SAR", label: "SAR (﷼)" },
	{ value: "AED", label: "AED (د.إ)" },
];

export const questionTypeOptions = [
	{ value: "YES_NO", labelKey: "typeYesNo" },
	{ value: "MULTIPLE_CHOICE", labelKey: "typeMultipleChoice" },
	{ value: "TEXT", labelKey: "typeText" },
	{ value: "NUMBER", labelKey: "typeNumber" },
	{ value: "DATE", labelKey: "typeDate" },
];

export const steps = [
	{
		id: 1,
		title: "Details",
		icon: null as React.ComponentType<{ className?: string }> | null,
	},
	{ id: 2, title: "Requirements", icon: null },
	{ id: 3, title: "Compensation", icon: null },
	{ id: 4, title: "Screening", icon: null },
	{ id: 5, title: "Preview", icon: null },
];
