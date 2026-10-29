import OfferTemplate from "../models/OfferTemplateModel.js";

const parseTemplate = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const discountType = body.discountType;
  const discountValue = Number(body.discountValue ?? 0);
  const minOrderAmount = Number(body.minOrderAmount ?? 0);
  const maxDiscount = body.maxDiscount === "" || body.maxDiscount == null ? null : Number(body.maxDiscount);
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const expiryDate = new Date(body.expiryDate);

  if (!name || name.length > 80 || !["percentage", "fixed", "free_delivery"].includes(discountType)) {
    return { error: "Enter an offer name and a valid discount type." };
  }
  if (!Number.isFinite(discountValue) || !Number.isFinite(minOrderAmount) || minOrderAmount < 0 ||
      (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0))) {
    return { error: "Enter valid discount and minimum-order amounts." };
  }
  if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) {
    return { error: "Percentage discount must be between 1% and 100%." };
  }
  if (discountType === "fixed" && discountValue <= 0) {
    return { error: "Fixed discount must be greater than zero." };
  }
  if (discountType === "free_delivery" && discountValue !== 0) {
    return { error: "Free delivery does not need a discount value." };
  }
  if (maxDiscount !== null && discountType !== "percentage") {
    return { error: "Maximum discount is only used with percentage offers." };
  }
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(expiryDate.getTime()) || expiryDate <= startDate || expiryDate <= new Date()) {
    return { error: "Choose a valid future expiry date after the start date." };
  }
  return { data: { name, description, discountType, discountValue, minOrderAmount, maxDiscount, startDate, expiryDate } };
};

export const getOfferTemplates = async (req, res) => {
  try {
    const offers = await OfferTemplate.find().sort({ createdAt: -1 });
    return res.json({ status: 1, data: offers });
  } catch (error) {
    console.error("Fetch offer templates error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to load offer templates." });
  }
};

export const createOfferTemplate = async (req, res) => {
  try {
    const parsed = parseTemplate(req.body);
    if (parsed.error) return res.status(400).json({ status: 0, message: parsed.error });
    const offer = await OfferTemplate.create(parsed.data);
    return res.status(201).json({ status: 1, message: "Offer template created successfully.", data: offer });
  } catch (error) {
    console.error("Create offer template error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to create offer template." });
  }
};

export const toggleOfferTemplate = async (req, res) => {
  try {
    const offer = await OfferTemplate.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ status: 0, message: "Offer template not found." });
    if (!offer.isActive && offer.expiryDate <= new Date()) {
      return res.status(400).json({ status: 0, message: "Expired templates cannot be activated. Create a new template with a future expiry date." });
    }
    offer.isActive = !offer.isActive;
    await offer.save();
    return res.json({ status: 1, message: `Offer template ${offer.isActive ? "activated" : "deactivated"}.`, data: offer });
  } catch (error) {
    console.error("Toggle offer template error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to update offer template." });
  }
};
