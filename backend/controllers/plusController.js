const mongoose = require('mongoose');
const PlusSubscription = require('../models/PlusSubscription');
const Hotel = require('../models/Hotel');
const Hall = require('../models/Hall');
const User = require('../models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const PLUS_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'HallHub Plus (Monthly)',
    price: 49,
    durationDays: 30,
    description: 'Ideal for month-by-month venue promotion and high season.',
    badge: 'Most Flexible',
    features: [
      '⭐ Featured badge on hotel and all hall listings',
      '🚀 Priority search boost for matching customer searches',
      '🏠 Front-page spotlight in Featured Venues section',
      '📸 Upload up to 15 photos per hall (vs 5 normal limit)',
      '⭐ Ability to promote all your venue halls',
      '📊 Premium visibility analytics & boost indicators',
    ],
  },
  quarterly: {
    id: 'quarterly',
    name: 'HallHub Plus (3 Months)',
    price: 129,
    durationDays: 90,
    description: 'Best value for continuous banquet & wedding season promotion.',
    badge: 'Popular',
    features: [
      '⭐ Featured badge on hotel and all hall listings',
      '🚀 Priority search boost for matching customer searches',
      '🏠 Front-page spotlight in Featured Venues section',
      '📸 Upload up to 15 photos per hall (vs 5 normal limit)',
      '⭐ Ability to promote all your venue halls',
      '📊 Premium visibility analytics & boost indicators',
      '💰 Save $18 compared to monthly plan',
    ],
  },
  annual: {
    id: 'annual',
    name: 'HallHub Plus (Annual)',
    price: 449,
    durationDays: 365,
    description: 'Year-round maximum visibility and VIP status across Hargeisa.',
    badge: 'Best Value',
    features: [
      '⭐ Featured badge on hotel and all hall listings',
      '🚀 Priority search boost for matching customer searches',
      '🏠 Front-page spotlight in Featured Venues section',
      '📸 Upload up to 15 photos per hall (vs 5 normal limit)',
      '⭐ Ability to promote all your venue halls',
      '📊 Premium visibility analytics & boost indicators',
      '👑 365 days of guaranteed prime placement',
    ],
  },
};

/**
 * Automatically synchronize expired subscriptions and remove Featured benefits
 * from hotels when expiresAt has passed.
 */
const syncExpiredSubscriptions = async () => {
  const now = new Date();

  // Find active subscriptions whose expiration date has passed
  const expiredSubs = await PlusSubscription.find({
    status: 'active',
    expiresAt: { $lte: now },
  });

  if (expiredSubs.length > 0) {
    const expiredIds = expiredSubs.map((s) => s._id);
    await PlusSubscription.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'expired' } }
    );

    for (const sub of expiredSubs) {
      const stillActive = await PlusSubscription.findOne({
        hotelId: sub.hotelId,
        status: 'active',
        expiresAt: { $gt: now },
      });
      if (!stillActive) {
        await Hotel.updateOne(
          { _id: sub.hotelId },
          { $set: { isFeatured: false, featuredExpiresAt: null } }
        );
      }
    }
  }

  // Guarantee any Hotel with passed featuredExpiresAt is deactivated
  await Hotel.updateMany(
    { isFeatured: true, featuredExpiresAt: { $lte: now } },
    { $set: { isFeatured: false, featuredExpiresAt: null } }
  );
};

/**
 * Public: Get available HallHub Plus plans and features.
 */
const getPlusPlans = async (req, res) => {
  try {
    return res.status(200).json({
      plans: Object.values(PLUS_PLANS),
      paymentInstructions: {
        zaad: 'Zaad Service: Send payment to Merchant 402288 or 063-4889900. Use subscription reference.',
        edahab: 'EDAHAB Service: Send payment to Merchant 701122 or 065-4889900. Use subscription reference.',
        telesom: 'Telesom/EVC: Send to 063-4889900. Use subscription reference.',
        bank_transfer: 'Dahabshiil Bank A/C: 102938475 (HallHub Enterprise Ltd).',
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve Plus plans',
      error: error.message,
    });
  }
};

/**
 * Public: Get active Plus / Featured hotels for the Homepage "Featured Venues" section.
 * Only hotels with active, non-expired Plus subscriptions and approved status appear.
 */
const getFeaturedHotels = async (req, res) => {
  try {
    await syncExpiredSubscriptions();

    const now = new Date();
    const hotels = await Hotel.find({
      verificationStatus: 'approved',
      isFeatured: true,
      featuredExpiresAt: { $gt: now },
    })
      .populate('ownerId', 'fullName email phone')
      .sort({ updatedAt: -1, createdAt: -1 });

    const hotelIds = hotels.map((h) => h._id);

    // Fetch halls for these featured hotels
    const halls = hotelIds.length
      ? await Hall.find({
          hotelId: { $in: hotelIds },
          isAvailable: { $ne: false },
        }).lean()
      : [];

    const hallsByHotel = new Map();
    halls.forEach((hall) => {
      const key = String(hall.hotelId);
      if (!hallsByHotel.has(key)) {
        hallsByHotel.set(key, []);
      }
      hallsByHotel.get(key).push(hall);
    });

    const featuredHotels = hotels.map((hotel) => {
      const plain = typeof hotel.toObject === 'function' ? hotel.toObject() : hotel;
      const hotelHalls = hallsByHotel.get(String(plain._id)) || [];

      // Calculate min price, max capacity
      let minPrice = 0;
      let maxCapacity = 0;
      if (hotelHalls.length > 0) {
        minPrice = Math.min(...hotelHalls.map((h) => Number(h.pricePerDay || 0)));
        maxCapacity = Math.max(...hotelHalls.map((h) => Number(h.capacity || 0)));
      }

      return {
        ...plain,
        isFeatured: true,
        halls: hotelHalls,
        hallCount: hotelHalls.length,
        minPrice,
        maxCapacity,
      };
    });

    return res.status(200).json({
      count: featuredHotels.length,
      featuredHotels,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve featured venues',
      error: error.message,
    });
  }
};

/**
 * Owner: Get current subscription status for own hotel.
 */
const getMyPlusSubscription = async (req, res) => {
  try {
    await syncExpiredSubscriptions();

    const hotel = await Hotel.findOne({ ownerId: req.user._id });
    if (!hotel) {
      return res.status(404).json({
        message: 'No hotel profile found for your account',
      });
    }

    const now = new Date();

    // Check for an active subscription
    const activeSubscription = await PlusSubscription.findOne({
      hotelId: hotel._id,
      status: 'active',
      expiresAt: { $gt: now },
    }).sort({ expiresAt: -1 });

    // Check for any pending payment subscription
    const pendingSubscription = await PlusSubscription.findOne({
      hotelId: hotel._id,
      status: 'pending_payment',
    }).sort({ createdAt: -1 });

    // Most recent subscription for history
    const latestSubscription = await PlusSubscription.findOne({
      hotelId: hotel._id,
    }).sort({ createdAt: -1 });

    const isPlusActive = Boolean(activeSubscription);
    const daysRemaining = activeSubscription
      ? Math.max(
          0,
          Math.ceil(
            (new Date(activeSubscription.expiresAt) - now) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return res.status(200).json({
      hotel: {
        _id: hotel._id,
        hotelName: hotel.hotelName,
        isFeatured: isPlusActive,
        featuredExpiresAt: activeSubscription?.expiresAt || null,
        verificationStatus: hotel.verificationStatus,
      },
      hasActivePlus: isPlusActive,
      activeSubscription: activeSubscription || null,
      pendingSubscription: pendingSubscription || null,
      latestSubscription: latestSubscription || null,
      daysRemaining,
      maxPhotosAllowed: isPlusActive ? 15 : 5,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve subscription status',
      error: error.message,
    });
  }
};

/**
 * Owner: Initiate a HallHub Plus subscription order.
 * Subscription starts in 'pending_payment' status until confirmed.
 */
const createPlusSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod, paymentReference, paymentNotes } = req.body;

    const selectedPlan = PLUS_PLANS[plan];
    if (!selectedPlan) {
      return res.status(400).json({
        message: 'Invalid plan selected. Choose monthly, quarterly, or annual.',
      });
    }

    const hotel = await Hotel.findOne({ ownerId: req.user._id });
    if (!hotel) {
      return res.status(404).json({
        message: 'Please register your hotel profile before subscribing to Plus.',
      });
    }

    if (hotel.verificationStatus !== 'approved') {
      return res.status(400).json({
        message:
          'Your hotel must be approved by the platform administrator before activating HallHub Plus.',
      });
    }

    // Generate unique reference if not supplied
    const cleanRef = String(paymentReference || '').trim();
    const generatedRef = cleanRef || `PLUS-${Date.now().toString().slice(-6)}`;

    // If an existing pending subscription exists, update it or create new
    let subscription = await PlusSubscription.findOne({
      hotelId: hotel._id,
      status: 'pending_payment',
    });

    if (subscription) {
      subscription.plan = selectedPlan.id;
      subscription.planName = selectedPlan.name;
      subscription.price = selectedPlan.price;
      subscription.paymentMethod = paymentMethod || subscription.paymentMethod || 'zaad';
      subscription.paymentReference = generatedRef;
      subscription.paymentNotes = paymentNotes ? String(paymentNotes).trim() : subscription.paymentNotes;
      await subscription.save();
    } else {
      subscription = await PlusSubscription.create({
        hotelId: hotel._id,
        ownerId: req.user._id,
        plan: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        status: 'pending_payment',
        paymentMethod: paymentMethod || 'zaad',
        paymentReference: generatedRef,
        paymentStatus: 'unpaid',
        paymentNotes: paymentNotes ? String(paymentNotes).trim() : '',
      });
    }

    return res.status(201).json({
      message:
        'Plus order created successfully. Complete payment to activate your featured benefits.',
      subscription,
      paymentInstructions: {
        amount: selectedPlan.price,
        reference: subscription.paymentReference,
        method: subscription.paymentMethod,
        message: `Please transfer $${selectedPlan.price} via ${subscription.paymentMethod.toUpperCase()} quoting reference: ${subscription.paymentReference}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create subscription order',
      error: error.message,
    });
  }
};

/**
 * Admin: Confirm payment and activate Plus subscription.
 * Can also be invoked by an automated payment webhook.
 */
const confirmPlusPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference, paymentNotes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }

    const subscription = await PlusSubscription.findById(id).populate('hotelId');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const planConfig = PLUS_PLANS[subscription.plan] || PLUS_PLANS.monthly;
    const durationDays = planConfig.durationDays || 30;

    const now = new Date();
    let startedAt = now;
    let expiresAt;

    // If hotel already has an active subscription that hasn't expired yet, extend it!
    const existingActive = await PlusSubscription.findOne({
      hotelId: subscription.hotelId._id,
      status: 'active',
      expiresAt: { $gt: now },
      _id: { $ne: subscription._id },
    }).sort({ expiresAt: -1 });

    if (existingActive && existingActive.expiresAt > now) {
      startedAt = existingActive.expiresAt;
      expiresAt = new Date(
        existingActive.expiresAt.getTime() + durationDays * 24 * 60 * 60 * 1000
      );
    } else {
      expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    subscription.status = 'active';
    subscription.paymentStatus = 'paid';
    subscription.startedAt = startedAt;
    subscription.expiresAt = expiresAt;

    if (paymentReference) {
      subscription.paymentReference = String(paymentReference).trim();
    }
    if (paymentNotes) {
      subscription.paymentNotes = String(paymentNotes).trim();
    }

    await subscription.save();

    // Activate featured status on Hotel
    await Hotel.findByIdAndUpdate(subscription.hotelId._id, {
      isFeatured: true,
      featuredExpiresAt: expiresAt,
    });

    const populated = await PlusSubscription.findById(subscription._id)
      .populate('hotelId', 'hotelName city address verificationStatus')
      .populate('ownerId', 'fullName email phone');

    return res.status(200).json({
      message: 'Payment confirmed! HallHub Plus subscription is now active.',
      subscription: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

/**
 * Admin: Expire or cancel a Plus subscription.
 */
const adminCancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }

    const subscription = await PlusSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // Check if hotel has any other active subscription
    const stillActive = await PlusSubscription.findOne({
      hotelId: subscription.hotelId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (!stillActive) {
      await Hotel.findByIdAndUpdate(subscription.hotelId, {
        isFeatured: false,
        featuredExpiresAt: null,
      });
    }

    return res.status(200).json({
      message: 'Subscription cancelled successfully.',
      subscription,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

/**
 * Owner: Cancel own pending subscription order.
 */
const cancelMySubscription = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ ownerId: req.user._id });
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const pending = await PlusSubscription.findOne({
      hotelId: hotel._id,
      status: 'pending_payment',
    });

    if (!pending) {
      return res.status(400).json({
        message: 'No pending payment subscription to cancel.',
      });
    }

    pending.status = 'cancelled';
    await pending.save();

    return res.status(200).json({
      message: 'Pending subscription order cancelled.',
      subscription: pending,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

/**
 * Admin: List all Plus subscriptions with filter.
 * Admin can see: Hotel, Owner, Plan, Price, Status, Start Date, Expiration Date.
 * Identifies active, pending, and expired subscriptions.
 */
const getAdminPlusSubscriptions = async (req, res) => {
  try {
    await syncExpiredSubscriptions();

    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      if (['active', 'pending_payment', 'expired', 'cancelled'].includes(status)) {
        filter.status = status;
      }
    }

    const subscriptions = await PlusSubscription.find(filter)
      .populate('hotelId', 'hotelName city address verificationStatus isFeatured')
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    // Calculate admin summary metrics
    const now = new Date();
    const allSubs = await PlusSubscription.find({});
    let totalRevenue = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    allSubs.forEach((sub) => {
      if (sub.paymentStatus === 'paid') {
        totalRevenue += Number(sub.price || 0);
      }
      if (sub.status === 'active' && sub.expiresAt && sub.expiresAt > now) {
        activeCount += 1;
      } else if (sub.status === 'pending_payment') {
        pendingCount += 1;
      } else if (sub.status === 'expired' || (sub.expiresAt && sub.expiresAt <= now)) {
        expiredCount += 1;
      }
    });

    return res.status(200).json({
      count: subscriptions.length,
      subscriptions,
      stats: {
        totalRevenue,
        activeCount,
        pendingCount,
        expiredCount,
        totalSubscriptions: allSubs.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve Plus subscriptions',
      error: error.message,
    });
  }
};

module.exports = {
  PLUS_PLANS,
  syncExpiredSubscriptions,
  getPlusPlans,
  getFeaturedHotels,
  getMyPlusSubscription,
  createPlusSubscription,
  confirmPlusPayment,
  adminCancelSubscription,
  cancelMySubscription,
  getAdminPlusSubscriptions,
};
