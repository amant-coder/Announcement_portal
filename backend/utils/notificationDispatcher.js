const Subscription = require('../models/Subscription');
const { sendNotification } = require('./webPushHelper');

/**
 * Query matching subscriptions and dispatch push notifications
 * Optimised to handle 900k+ subscriptions cleanly using Mongoose streaming cursors.
 */
async function triggerPushNotifications(announcement, vapidKeys) {
  if (!vapidKeys || !vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.warn('[Push Dispatcher] Skipping: VAPID keys not configured.');
    return;
  }

  try {
    // Only send notification for PUBLISHED notices
    if (announcement.status !== 'PUBLISHED') {
      return;
    }

    const { courseCodes = [], targetYears = [], title } = announcement;

    // Build matching query
    const query = {
      $and: [
        {
          $or: [
            { courses: 'ALL' },
            { courses: { $in: courseCodes } }
          ]
        },
        {
          $or: [
            { years: 'ALL' },
            { years: { $in: targetYears } }
          ]
        }
      ]
    };

    const payload = {
      title: `Notice: ${courseCodes.join('/')} (${targetYears.join('/')})`,
      body: title,
      url: `/#notices`
    };

    console.log(`[Push Dispatcher] Triggering push notifications for notice: "${title}"`);

    // Stream subscriptions via cursor to prevent loading 900k documents into memory at once
    const cursor = Subscription.find(query).cursor({ batchSize: 200 });

    const CONCURRENCY_LIMIT = 50;
    let activeDispatches = [];
    let processedCount = 0;
    let successCount = 0;

    for (let sub = await cursor.next(); sub != null; sub = await cursor.next()) {
      const currentSub = sub; // capture reference
      processedCount++;

      const dispatchPromise = (async () => {
        try {
          const res = await sendNotification(currentSub, payload, vapidKeys);
          if (res.success) {
            successCount++;
          } else {
            // Clean up invalid or expired subscriptions (status 410 Gone or 404 Not Found)
            if (res.statusCode === 410 || res.statusCode === 404) {
              await Subscription.deleteOne({ _id: currentSub._id }).catch((e) => {
                console.error(`[Push Dispatcher] Failed to remove expired subscription:`, e.message);
              });
            }
          }
        } catch (err) {
          // Log specific errors but do not crash the stream
          console.warn(`[Push Dispatcher] Delivery error for ${currentSub.endpoint}: ${err.message}`);
        }
      })();

      activeDispatches.push(dispatchPromise);

      // Once the concurrency limit is reached, wait for this batch to complete
      if (activeDispatches.length >= CONCURRENCY_LIMIT) {
        await Promise.all(activeDispatches);
        activeDispatches = [];

        // Yield execution to the event loop so incoming client HTTP requests remain responsive
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    // Wait for any remaining dispatches in the final chunk
    if (activeDispatches.length > 0) {
      await Promise.all(activeDispatches);
    }

    console.log(`[Push Dispatcher] Finished notices delivery. Sent: ${successCount}/${processedCount} successfully.`);
  } catch (err) {
    console.error('[Push Dispatcher] Fatal error in dispatcher loop:', err.message);
  }
}

module.exports = {
  triggerPushNotifications
};
