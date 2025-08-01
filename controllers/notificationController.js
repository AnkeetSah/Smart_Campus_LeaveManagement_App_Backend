import Subscription from '../models/subscriptionModel.js';

export const saveSubscription = async (req, res) => {
  try {
    const { userId, userRole, subscription } = req.body;

    // Check if subscription already exists for this endpoint and user
    const existing = await Subscription.findOne({
      userId: userId,
      'subscription.endpoint': subscription.endpoint,
    });

    if (existing) {
      return res.status(200).json({ message: 'Subscription already exists' });
    }

    const newSub = new Subscription({
      userId,
      userRole,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
    });

    await newSub.save();
    res.status(200).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save subscription:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



