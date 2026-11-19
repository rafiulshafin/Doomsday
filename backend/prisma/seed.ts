import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Doomsday Ready database with sample MCU data...");

  // Clear existing data
  await prisma.moviePrerequisite.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.cinema.deleteMany({});

  // 1. Create Movies
  const ironMan = await prisma.movie.create({
    data: { title: "Iron Man", releaseYear: 2008, runtime: 126, watched: true },
  });

  const firstAvenger = await prisma.movie.create({
    data: { title: "Captain America: The First Avenger", releaseYear: 2011, runtime: 124, watched: true },
  });

  const theAvengers = await prisma.movie.create({
    data: { title: "The Avengers", releaseYear: 2012, runtime: 143, watched: true },
  });

  const civilWar = await prisma.movie.create({
    data: { title: "Captain America: Civil War", releaseYear: 2016, runtime: 147, watched: false },
  });

  const ragnarok = await prisma.movie.create({
    data: { title: "Thor: Ragnarok", releaseYear: 2017, runtime: 130, watched: false },
  });

  const infinityWar = await prisma.movie.create({
    data: { title: "Avengers: Infinity War", releaseYear: 2018, runtime: 149, watched: false },
  });

  const endgame = await prisma.movie.create({
    data: { title: "Avengers: Endgame", releaseYear: 2019, runtime: 181, watched: false },
  });

  const doomsday = await prisma.movie.create({
    data: { title: "Avengers: Doomsday", releaseYear: 2026, runtime: 180, watched: false },
  });

  // 2. Link Prerequisites (from table in PDF)
  // The Avengers -> Iron Man, The First Avenger
  await prisma.moviePrerequisite.createMany({
    data: [
      { movieId: theAvengers.id, prerequisiteId: ironMan.id },
      { movieId: theAvengers.id, prerequisiteId: firstAvenger.id },
    ],
  });

  // Captain America: Civil War -> The Avengers
  await prisma.moviePrerequisite.create({
    data: { movieId: civilWar.id, prerequisiteId: theAvengers.id },
  });

  // Avengers: Infinity War -> Civil War, Ragnarok
  await prisma.moviePrerequisite.createMany({
    data: [
      { movieId: infinityWar.id, prerequisiteId: civilWar.id },
      { movieId: infinityWar.id, prerequisiteId: ragnarok.id },
    ],
  });

  // Avengers: Endgame -> Infinity War
  await prisma.moviePrerequisite.create({
    data: { movieId: endgame.id, prerequisiteId: infinityWar.id },
  });

  // Avengers: Doomsday -> Endgame
  await prisma.moviePrerequisite.create({
    data: { movieId: doomsday.id, prerequisiteId: endgame.id },
  });

  // 3. Create Sample Cinemas (matching bundle size test cases in PDF)
  await prisma.cinema.createMany({
    data: [
      { name: "Stark Starkplex IMAX", bundleSizes: [1, 3, 4] },
      { name: "Wakanda Royal Cinema", bundleSizes: [2, 5] },
      { name: "Avengers Campus Theater", bundleSizes: [6, 9, 20] },
      { name: "Kamar-Taj Cineplex", bundleSizes: [4, 6] },
    ],
  });

  console.log("Database seeded successfully with 8 MCU movies and 4 sample cinemas!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
