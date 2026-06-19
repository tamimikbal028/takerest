# Scaling & Sharding Guide for 1B Users

This document outlines the architectural roadmap and best practices for scaling the **Bidda** education platform from its current state to a global scale (1B+ users).

---

## 🚀 1. Core Architecture Strategy

Even though we are using **Node.js** and **MongoDB** (different from Instagram's initial Python/Postgres stack), the scaling principles remain the same.

### A. Horizontal Sharding Preparation
*   **Shard Key:** Always use `userId` (or a derived hash) as the primary shard key for user-related data (posts, profiles, analytics).
*   **Routing:** Leverage MongoDB's built-in `mongos` router for transparent sharding.
*   **Uniform IDs:** Use **UUID v4** or **Snowflake IDs** instead of simple auto-increments to avoid ID collisions across different database shards.

### B. Denormalization (Performance over Normalization)
*   **Avoid `$lookup` (Joins):** In a sharded environment, cross-shard joins are extremely slow.
*   **Data Redundancy:** Store essential related data (e.g., `userName`, `avatarUrl`) directly within the post/comment documents.
*   **Trade-off:** We trade storage space for read speed.

---

## 🛠️ 2. Database Scaling (MongoDB)

### Sharding Logic
1.  **Logical Sharding:** Start with multiple shards on a single region (e.g., South Asia) to handle load.
2.  **Geographical Sharding:** As we reach 100M+ users beyond Bangladesh, deploy shards in regions closer to the users (Europe, North America, etc.).
3.  **Indexing:** Ensure every frequent query includes the **Shard Key**. A query without a shard key is a "Scatter-Gather" query which hits every server and kills performance.

---

## ⚡ 3. Backend & Caching Layer

### Stateless Services
*   **No Local Sessions:** Store all session data in **Redis**.
*   **JWT Authentication:** Use JWTs for stateless auth so any backend instance can verify any user.
*   **Load Balancing:** Use Nginx or AWS ALB to distribute traffic across multiple Node.js instances.

### Caching Strategy
*   **Redis for Hot Data:** Cache course metadata, trending posts, and top teachers.
*   **Cache Invalidation:** Use a "Write-through" or "Cache-aside" pattern to ensure data consistency.

---

## 📂 4. Media & Content Delivery (CDN)

*   **Current:** Using Cloudinary (Great for start).
*   **Next Level:** Move heavy assets to **AWS S3 / Google Cloud Storage**.
*   **CDN:** Use **Cloudfront** or **Cloudflare** for edge-caching media within Bangladesh and beyond to reduce latency.

---

## 📈 5. To-Do Checklist for Developers
- [ ] Implement UUID for all new primary keys.
- [ ] Review schemas to denormalize authors' info in high-read collections.
- [ ] Ensure all Mongoose queries include the shard key (`userId`).
- [ ] Transition from local file storage to Cloudinary/S3 completely.
- [ ] Setup Redis for session management.

---
*Note: This guide is a living document. Update it as the system evolves.*
