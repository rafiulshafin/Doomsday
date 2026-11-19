import { Router } from "express";
import {
  createMovie,
  listMovies,
  updateMovie,
  getRewatchOrder,
} from "../controllers/movieController.js";

const router = Router();

router.post("/", createMovie);
router.get("/", listMovies);
router.patch("/:id", updateMovie);
router.get("/:id/rewatch-order", getRewatchOrder);

export default router;
