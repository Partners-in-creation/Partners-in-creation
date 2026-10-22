// Seeds a fresh database with the settings row, a sample weekly schedule and a
// welcome note, so the site isn't empty on first run. Everything here is
// placeholder content meant to be edited or deleted in the admin dashboard.
import { PrismaClient } from "@prisma/client";
import { generateSessions, todayIn } from "../src/lib/series";

const db = new PrismaClient();

async function main() {
  const settings = await db.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  if ((await db.classSeries.count()) === 0) {
    const series = await db.classSeries.create({
      data: {
        title: "[Placeholder] Weekly Torah class",
        description: "",
        daysOfWeek: "0,3",
        startTime: "20:00",
        endTime: "21:00",
        timezone: settings.timezone,
        format: "IN_PERSON",
        venueName: "[Placeholder] Venue name",
        address: "[Placeholder] Street address",
        locationVisibility: "PRIVATE",
      },
    });
    const n = await generateSessions(series, todayIn(series.timezone), 8);
    console.log(`Created a sample weekly schedule with ${n} dates.`);
  }

  if ((await db.announcement.count()) === 0) {
    await db.announcement.create({
      data: {
        title: "Welcome to our new website",
        body: "[Placeholder] Class times, recordings and updates will be posted here. Edit or delete this note in the admin dashboard.",
        category: "ANNOUNCEMENT",
      },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
