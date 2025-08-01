import express from 'express'
import {saveSubscription} from '../controllers/notificationController.js'

const router=express.Router()

// Route to handle push subscription from frontend
router.post('/subscribe', saveSubscription);

export default router;