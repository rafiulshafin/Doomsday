import { Router } from "express";
import {
  createCinema,
  listCinemas,
  getBookingQuote,
} from "../controllers/cinemaController.js";

const router = Router();

router.post("/", createCinema);
router.get("/", listCinemas);
router.get("/:id/booking", getBookingQuote);

export default router;
