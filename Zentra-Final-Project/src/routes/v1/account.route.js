const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { accountValidation } = require('../../validations');
const { accountController } = require('../../controllers');

const router = express.Router();

// ─── Account CRUD ────────────────────────────────────────────────────
router.post('/', auth(), validate(accountValidation.createAccount), accountController.createAccount);
router.get('/', auth(), validate(accountValidation.getAccounts), accountController.getAccounts);
router.get('/:accountId', auth(), validate(accountValidation.getAccount), accountController.getAccount);
router.delete('/:accountId', auth(), validate(accountValidation.deleteAccount), accountController.deleteAccount);

// ─── Account Actions ─────────────────────────────────────────────────
router.post('/:accountId/sync', auth(), validate(accountValidation.triggerSync), accountController.triggerSync);

// ─── Account Data Queries ────────────────────────────────────────────
router.get('/:accountId/trades', auth(), validate(accountValidation.getTrades), accountController.getTrades);
router.get('/:accountId/positions', auth(), validate(accountValidation.getPositions), accountController.getPositions);
router.get('/:accountId/summary', auth(), validate(accountValidation.getSummary), accountController.getSummary);
router.get('/:accountId/sync-logs', auth(), validate(accountValidation.getSyncLogs), accountController.getSyncLogs);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: MT5 account management and data queries
 */

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Register a new MT5 account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - brokerServer
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: "12345678"
 *               brokerServer:
 *                 type: string
 *                 example: "MetaQuotes-Demo"
 *               company:
 *                 type: string
 *                 example: "MetaQuotes Ltd."
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               leverage:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       "201":
 *         description: Account created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "409":
 *         description: Account already exists
 *
 *   get:
 *     summary: List all MT5 accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of accounts
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: Get account details
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Account details
 *       "404":
 *         description: Account not found
 *
 *   delete:
 *     summary: Delete account and all related data
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Account deleted
 *       "404":
 *         description: Account not found
 */

/**
 * @swagger
 * /accounts/{accountId}/sync:
 *   post:
 *     summary: Trigger MT5 trade sync
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromDate:
 *                 type: string
 *                 format: date-time
 *               toDate:
 *                 type: string
 *                 format: date-time
 *               syncType:
 *                 type: string
 *                 enum: [full, incremental]
 *     responses:
 *       "200":
 *         description: Sync completed
 *       "409":
 *         description: Sync already in progress
 */

/**
 * @swagger
 * /accounts/{accountId}/trades:
 *   get:
 *     summary: Get trades for account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       "200":
 *         description: Trades list with pagination
 */

/**
 * @swagger
 * /accounts/{accountId}/positions:
 *   get:
 *     summary: Get open positions
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Open positions list
 */

/**
 * @swagger
 * /accounts/{accountId}/summary:
 *   get:
 *     summary: Get daily summaries
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: Daily summaries list
 */

/**
 * @swagger
 * /accounts/{accountId}/sync-logs:
 *   get:
 *     summary: Get sync history
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       "200":
 *         description: Sync logs list
 */
