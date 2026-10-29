import OfferTemplate from "../models/OfferTemplateModel.js";
import RestaurantOffer from "../models/RestaurantOfferModel.js";

const now = () => new Date();

export const getRestaurantOfferTemplates = async (req, res) => {
  try {
    const current = now();
    const templates = await OfferTemplate.find({
      isActive: true,
      startDate: { $lte: current },
      expiryDate: { $gt: current },
    }).sort({ createdAt: -1 }).lean();
    const participation = await RestaurantOffer.find({ restaurantId: req.user.id }).lean();
    const statusByTemplate = new Map(participation.map((item) => [String(item.offerTemplateId), item.isActive]));
    return res.json({ status: 1, data: templates.map((template) => ({
      ...template,
      isParticipating: statusByTemplate.get(String(template._id)) === true,
    })) });
  } catch (error) {
    console.error("Fetch restaurant offers error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to load available offers." });
  }
};

export const toggleRestaurantOffer = async (req, res) => {
  try {
    const template = await OfferTemplate.findOne({
      _id: req.params.offerId,
      isActive: true,
      startDate: { $lte: now() },
      expiryDate: { $gt: now() },
    });
    if (!template) return res.status(404).json({ status: 0, message: "This offer is not currently available." });

    const restaurantId = req.user.id;
    const existing = await RestaurantOffer.findOne({ restaurantId, offerTemplateId: template._id });
    if (existing?.isActive) {
      existing.isActive = false;
      await existing.save();
      return res.json({ status: 1, message: "Offer deactivated for your restaurant.", data: existing });
    }

    // Keep one active discount offer per restaurant, while allowing a separate free-delivery offer.
    if (template.discountType !== "free_delivery") {
      const activeDiscountIds = await OfferTemplate.find({ discountType: { $ne: "free_delivery" } }).distinct("_id");
      await RestaurantOffer.updateMany(
        { restaurantId, offerTemplateId: { $in: activeDiscountIds }, isActive: true },
        { $set: { isActive: false } }
      );
    } else {
      const activeFreeDeliveryIds = await OfferTemplate.find({ discountType: "free_delivery" }).distinct("_id");
      await RestaurantOffer.updateMany(
        { restaurantId, offerTemplateId: { $in: activeFreeDeliveryIds }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const participation = await RestaurantOffer.findOneAndUpdate(
      { restaurantId, offerTemplateId: template._id },
      { $set: { isActive: true, activatedAt: now() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ status: 1, message: "Offer activated for your restaurant.", data: participation });
  } catch (error) {
    console.error("Update restaurant offer error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to update this offer." });
  }
};


export const getAvailableCustomerOffers = async (req, res) => {
  try {
    const current = now();
    const participations = await RestaurantOffer.find({ isActive: true })
      .populate({ path: "offerTemplateId", match: { isActive: true, startDate: { $lte: current }, expiryDate: { $gt: current } } })
      .populate({ path: "restaurantId", select: "restaurantName coverImage profilePicture isOpen" })
      .sort({ activatedAt: -1 }).lean();
    const data = participations.filter((item) => item.offerTemplateId && item.restaurantId && item.restaurantId.isOpen)
      .map((item) => ({
        _id: item._id,
        restaurantOfferId: item._id,
        restaurantId: item.restaurantId._id,
        restaurantName: item.restaurantId.restaurantName || "Restaurant",
        coverImage: item.restaurantId.coverImage || item.restaurantId.profilePicture || "",
        offerName: item.offerTemplateId.name,
        description: item.offerTemplateId.description,
        discountType: item.offerTemplateId.discountType,
        discountValue: item.offerTemplateId.discountValue,
        maxDiscount: item.offerTemplateId.maxDiscount,
        minOrderAmount: item.offerTemplateId.minOrderAmount,
        startDate: item.offerTemplateId.startDate,
        expiryDate: item.offerTemplateId.expiryDate,
      }));
    return res.json({ status: 1, data });
  } catch (error) {
    console.error("Fetch customer restaurant offers error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to load restaurant offers." });
  }
};
