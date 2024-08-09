import { Job, JobBoard } from "./types.ts";

function addDaysUntil(targetDate: Date, startDate: Date) {
  const result = [];
  const currentDate = new Date(startDate);

  while (currentDate <= targetDate) {
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 5);
  }

  return result;
}

export function createRandomJobs() {
  const jobs: Job[] = [];
  const dates = addDaysUntil(new Date(), new Date(2024, 2, 1));
  const jobBoards = ["indeed", "linkedin", "glassdoor", "other"];

  for (const d of dates) {
    const status = Math.random() < 0.05 ? "interviewed" : "applied"; // 5% chance for "interview"
    const jobBoard = jobBoards[Math.floor(Math.random() * jobBoards.length)];

    jobs.push({
      dateApplied: d,
      company: "Random company " + d.getTime(),
      status: status,
      jobBoard: jobBoard as JobBoard,
    });
  }

  return jobs;
}
