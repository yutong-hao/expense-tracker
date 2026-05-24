-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: expense_tracker
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `expense_tracker`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `expense_tracker` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `expense_tracker`;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `bg_color` varchar(40) NOT NULL,
  `border_color` varchar(40) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Food','#ead5be','#d4b896','2026-05-24 09:37:27'),(2,'Shopping','hsl(207 51% 83%)','hsl(207 40% 71%)','2026-05-24 09:37:27'),(3,'Transport','hsl(184 51% 83%)','hsl(184 40% 71%)','2026-05-24 09:37:27'),(4,'Utilities','hsl(350 51% 83%)','hsl(350 40% 71%)','2026-05-24 09:37:27');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `description` text,
  `tags` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,NULL,'Lunch','Food',12.50,'2026-04-01','Quick meal',NULL,'2026-05-17 03:46:54'),(2,NULL,'Uber','Transport',25.00,'2026-04-02','Ride to uni',NULL,'2026-05-17 03:46:54'),(3,NULL,'Shoes','Shopping',80.00,'2026-04-03','New sneakers',NULL,'2026-05-17 03:46:54'),(4,15,'BBQ','Transport',3.76,'2026-05-16','',NULL,'2026-05-17 03:56:18'),(5,15,'Broadway','Transport',2.31,'2026-05-10','',NULL,'2026-05-17 03:56:54'),(6,15,'eat','Food',25.60,'2026-05-15','mlt',NULL,'2026-05-17 03:59:22'),(7,15,'bread','Food',10.90,'2026-05-15','d',NULL,'2026-05-17 03:59:42'),(8,15,'618','Shopping',5.21,'2026-05-21','mm',NULL,'2026-05-20 22:19:24'),(9,15,'opal','Transport',50.00,'2026-05-21','',NULL,'2026-05-21 02:46:18'),(47,58,'wupin','Shopping',53.00,'2026-05-07','www',NULL,'2026-05-24 03:44:07'),(48,58,'ww','Shopping',23.00,'2026-05-14','we',NULL,'2026-05-24 03:44:36'),(49,58,'333','Transport',111.22,'2026-04-09','232',NULL,'2026-05-24 03:44:51'),(50,58,'122','Food',333.00,'2026-03-12','3344',NULL,'2026-05-24 03:45:37'),(51,58,'ec','Utilities',111.00,'2026-03-01','',NULL,'2026-05-24 05:48:28'),(52,58,'ed','Utilities',123.00,'2026-03-18','',NULL,'2026-05-24 05:49:24'),(53,58,'opal','Transport',50.00,'2025-04-24','1',NULL,'2026-05-24 06:29:29');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity`
--

DROP TABLE IF EXISTS `user_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_activity_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity`
--

LOCK TABLES `user_activity` WRITE;
/*!40000 ALTER TABLE `user_activity` DISABLE KEYS */;
INSERT INTO `user_activity` VALUES (1,1,'login','Logged in','2026-05-17 03:51:28'),(2,2,'login','Logged in','2026-05-17 03:52:08'),(3,2,'logout','Logged out','2026-05-17 03:52:15'),(4,1,'login','Logged in','2026-05-17 03:52:16'),(5,15,'register','Registered a new account','2026-05-17 03:52:22'),(6,15,'login','Logged in','2026-05-17 03:52:35'),(7,15,'create_expense','Created expense #4: BBQ','2026-05-17 03:56:18'),(8,15,'create_expense','Created expense #5: Broadway','2026-05-17 03:56:54'),(9,15,'create_expense','Created expense #6: eat','2026-05-17 03:59:22'),(10,15,'create_expense','Created expense #7: bread','2026-05-17 03:59:42'),(11,15,'logout','Logged out','2026-05-17 04:00:20'),(12,2,'login','Logged in','2026-05-17 04:00:27'),(13,2,'logout','Logged out','2026-05-17 04:00:45'),(14,2,'login','Logged in','2026-05-17 04:04:33'),(15,2,'logout','Logged out','2026-05-17 04:05:19'),(16,15,'login','Logged in','2026-05-17 04:05:36'),(17,15,'logout','Logged out','2026-05-17 04:12:38'),(18,1,'login','Logged in','2026-05-17 04:12:57'),(19,1,'login','Logged in','2026-05-17 04:21:18'),(20,1,'update_profile','Updated username','2026-05-17 04:21:19'),(21,1,'update_profile','Updated username','2026-05-17 04:21:19'),(26,1,'login','Logged in','2026-05-17 04:21:39'),(27,1,'delete_user','Deleted user #18','2026-05-17 04:21:39'),(28,1,'login','Logged in','2026-05-17 04:22:03'),(29,1,'login','Logged in','2026-05-17 05:07:01'),(30,1,'logout','Logged out','2026-05-17 05:07:10'),(31,15,'login','Logged in','2026-05-17 05:07:22'),(32,15,'update_profile','Updated username','2026-05-17 05:07:45'),(33,15,'logout','Logged out','2026-05-17 05:10:16'),(34,1,'login','Logged in','2026-05-20 22:01:43'),(35,1,'login','Logged in','2026-05-20 22:02:38'),(36,1,'logout','Logged out','2026-05-20 22:03:25'),(37,15,'login','Logged in','2026-05-20 22:04:22'),(38,15,'logout','Logged out','2026-05-20 22:07:08'),(39,1,'login','Logged in','2026-05-20 22:07:16'),(40,1,'logout','Logged out','2026-05-20 22:07:53'),(41,15,'login','Logged in','2026-05-20 22:07:59'),(42,1,'login','Logged in','2026-05-20 22:11:55'),(43,1,'login','Logged in','2026-05-20 22:13:14'),(44,2,'login','Logged in','2026-05-20 22:13:14'),(45,1,'login','Logged in','2026-05-20 22:14:00'),(46,2,'login','Logged in','2026-05-20 22:14:00'),(47,1,'login','Logged in','2026-05-20 22:14:41'),(48,2,'login','Logged in','2026-05-20 22:14:41'),(49,15,'logout','Logged out','2026-05-20 22:15:31'),(50,1,'login','Logged in','2026-05-20 22:15:50'),(51,1,'logout','Logged out','2026-05-20 22:16:08'),(52,15,'login','Logged in','2026-05-20 22:18:20'),(53,15,'create_expense','Created expense #8: 818','2026-05-20 22:19:24'),(54,15,'logout','Logged out','2026-05-20 22:20:06'),(55,1,'login','Logged in','2026-05-20 22:26:01'),(56,15,'login','Logged in','2026-05-20 22:29:31'),(57,15,'logout','Logged out','2026-05-20 22:37:16'),(58,1,'login','Logged in','2026-05-20 22:37:28'),(59,1,'logout','Logged out','2026-05-20 22:40:07'),(60,1,'login','Logged in','2026-05-20 22:44:17'),(61,1,'logout','Logged out','2026-05-20 22:45:17'),(62,15,'login','Logged in','2026-05-20 22:45:42'),(63,1,'login','Logged in','2026-05-20 22:55:16'),(64,1,'logout','Logged out','2026-05-20 22:55:39'),(65,15,'logout','Logged out','2026-05-20 23:14:13'),(66,15,'login','Logged in','2026-05-20 23:15:41'),(67,15,'logout','Logged out','2026-05-20 23:26:47'),(68,15,'login','Logged in','2026-05-21 02:45:16'),(69,15,'create_expense','Created expense #9: opal','2026-05-21 02:46:18'),(70,15,'update_expense','Updated expense #8: 618','2026-05-21 02:49:12'),(71,15,'login','Logged in','2026-05-21 02:50:16'),(72,15,'logout','Logged out','2026-05-21 03:46:54'),(73,1,'login','Logged in','2026-05-21 03:47:02'),(74,1,'logout','Logged out','2026-05-21 03:47:57'),(75,15,'login','Logged in','2026-05-21 03:51:06'),(76,15,'logout','Logged out','2026-05-21 03:57:55'),(77,1,'login','Logged in','2026-05-21 03:58:02'),(78,1,'login','Logged in','2026-05-21 04:20:56'),(79,1,'login','Logged in','2026-05-21 04:30:04'),(80,1,'login','Logged in','2026-05-21 04:30:21'),(81,1,'logout','Logged out','2026-05-21 04:41:31'),(82,15,'login','Logged in','2026-05-21 04:41:44'),(83,15,'logout','Logged out','2026-05-21 12:41:16'),(84,1,'login','Logged in','2026-05-21 12:41:23'),(85,1,'logout','Logged out','2026-05-21 12:43:56'),(86,15,'login','Logged in','2026-05-21 12:44:05'),(87,15,'logout','Logged out','2026-05-21 12:49:53'),(88,15,'login','Logged in','2026-05-24 04:29:06'),(89,1,'login','Logged in','2026-05-24 05:03:50'),(90,1,'logout','Logged out','2026-05-24 05:05:53'),(91,58,'register','Registered a new account','2026-05-24 03:42:42'),(92,58,'login','Logged in','2026-05-24 03:42:59'),(93,58,'create_expense','Created expense #46: shiwu','2026-05-24 03:43:39'),(94,58,'create_expense','Created expense #47: wupin','2026-05-24 03:44:07'),(95,58,'delete_expense','Deleted expense #46','2026-05-24 03:44:13'),(96,58,'update_expense','Updated expense #47: wupin','2026-05-24 03:44:17'),(97,58,'create_expense','Created expense #48: ww','2026-05-24 03:44:36'),(98,58,'create_expense','Created expense #49: 333','2026-05-24 03:44:51'),(99,58,'create_expense','Created expense #50: 122','2026-05-24 03:45:37'),(100,58,'login','Logged in','2026-05-24 03:46:57'),(101,58,'login','Logged in','2026-05-24 03:55:37'),(102,58,'login','Logged in','2026-05-24 04:02:08'),(103,58,'logout','Logged out','2026-05-24 05:04:10'),(104,58,'login','Logged in','2026-05-24 05:13:52'),(105,58,'logout','Logged out','2026-05-24 05:15:24'),(106,58,'login','Logged in','2026-05-24 05:21:29'),(107,58,'login','Logged in','2026-05-24 05:22:20'),(108,58,'update_expense','Updated expense #48: ww','2026-05-24 05:22:41'),(109,58,'logout','Logged out','2026-05-24 05:28:56'),(110,58,'login','Logged in','2026-05-24 05:29:17'),(111,58,'create_expense','Created expense #51: health','2026-05-24 05:48:28'),(112,58,'create_expense','Created expense #52: ed','2026-05-24 05:49:24'),(113,58,'update_expense','Updated expense #51: ec','2026-05-24 05:59:04'),(114,58,'login','Logged in','2026-05-24 06:06:00'),(115,58,'logout','Logged out','2026-05-24 06:17:25'),(116,1,'login','Logged in','2026-05-24 06:17:35'),(117,1,'logout','Logged out','2026-05-24 06:18:19'),(118,58,'login','Logged in','2026-05-24 06:18:27'),(119,58,'login','Logged in','2026-05-24 06:20:19'),(120,58,'create_expense','Created expense #53: opal','2026-05-24 06:29:29'),(121,58,'login','Logged in','2026-05-24 06:30:51'),(122,58,'login','Logged in','2026-05-24 09:59:11'),(123,58,'logout','Logged out','2026-05-24 09:59:39'),(124,1,'login','Logged in','2026-05-24 09:59:49'),(125,1,'logout','Logged out','2026-05-24 10:01:04'),(126,1,'login','Logged in','2026-05-24 10:01:13'),(127,1,'create_category','Created category f','2026-05-24 10:02:00'),(128,1,'delete_category','Deleted category f','2026-05-24 10:02:05'),(129,1,'logout','Logged out','2026-05-24 10:03:26'),(130,58,'login','Logged in','2026-05-24 10:03:34'),(131,1,'login','Logged in','2026-05-24 10:22:25');
/*!40000 ALTER TABLE `user_activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin123','$2b$10$uVI4cOG7JYPANSr2p4BkpevU2LHX5Ml.06r2ASKh0KicxleYju13e','admin','2026-05-17 03:47:49'),(2,'zzy','$2b$10$A5Nj/w7CDMk3yserQBhVGukBcI3LLTdgDpuWlZwsAJjiUeSGu85LG','admin','2026-05-17 03:47:49'),(15,'Zoe','$2b$10$RR3.aI3u309b54KGFUaZdOsdXkLodetxLUbsHEbzLmhMFzJ7eBII6','user','2026-05-17 03:52:22'),(58,'qaz','$2b$10$0xXlyD5FvQhLsBEWRUnb9epq/3sqsxgZ46m8gG.UqESGoWnSo7DjG','user','2026-05-24 03:42:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'expense_tracker'
--

--
-- Dumping routines for database 'expense_tracker'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-24 20:22:38
