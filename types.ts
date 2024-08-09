export type Status = "applied" | "rejected" | "interviewed" | "accepted";
export type JobBoard = "linkedin" | "glassdoor" | "indeed" | "other";
export interface Job {
  dateApplied: Date;
  company: string;
  status: Status;
  jobBoard: JobBoard;
}
