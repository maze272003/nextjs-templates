-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 12, 2025 at 05:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `my_auth_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `content`, `sender_id`, `receiver_id`, `created_at`) VALUES
(64, 'hey', 8, 7, '2025-07-11 18:18:30'),
(65, 'hey', 7, 8, '2025-07-11 18:18:32'),
(66, 'asdasd', 8, 7, '2025-07-11 18:18:36'),
(67, 'ajmjm', 7, 8, '2025-07-11 18:18:40'),
(68, 'hey', 8, 7, '2025-07-11 18:22:50'),
(69, 'asn', 8, 7, '2025-07-11 18:26:49'),
(70, 'yung ani', 7, 8, '2025-07-11 18:26:51'),
(71, 'qwertyuiasdfagshdj', 8, 7, '2025-07-11 18:27:07'),
(72, 'sdfghjkasdertyui', 7, 8, '2025-07-11 18:27:10'),
(73, 'asdasd', 7, 8, '2025-07-11 18:27:15'),
(74, 'asd', 7, 8, '2025-07-11 18:27:16'),
(75, 'asd', 7, 8, '2025-07-11 18:27:16'),
(76, 'asd', 7, 8, '2025-07-11 18:27:17'),
(77, 'asd', 7, 8, '2025-07-11 18:27:21'),
(78, 'ds', 7, 8, '2025-07-11 18:27:21'),
(79, 'asd', 7, 8, '2025-07-11 18:27:21'),
(80, 'asd', 7, 8, '2025-07-11 18:27:23'),
(81, 'asd', 7, 8, '2025-07-11 18:27:23'),
(82, 'asd', 7, 8, '2025-07-11 18:27:23'),
(83, 'a', 7, 8, '2025-07-11 18:27:23'),
(84, 'a', 7, 8, '2025-07-11 18:27:23'),
(85, 'sd', 7, 8, '2025-07-11 18:27:23'),
(86, 'asd', 7, 8, '2025-07-11 18:27:23'),
(87, 'a', 7, 8, '2025-07-11 18:27:23'),
(88, 'asdfasdfasdf', 8, 7, '2025-07-11 18:30:12'),
(89, 'fasdfasdfasdf', 7, 8, '2025-07-11 18:30:13'),
(90, 'asdf', 7, 8, '2025-07-11 18:30:14'),
(91, 'asdf', 7, 8, '2025-07-11 18:30:14'),
(92, 'asdf', 7, 8, '2025-07-11 18:30:14'),
(93, 'as', 7, 8, '2025-07-11 18:30:14'),
(94, 'dfa', 7, 8, '2025-07-11 18:30:15'),
(95, 'sdf', 7, 8, '2025-07-11 18:30:17'),
(96, 'asd', 7, 8, '2025-07-11 18:30:20'),
(97, 'fsdf', 7, 8, '2025-07-11 18:30:20'),
(98, 'dsa', 7, 8, '2025-07-11 18:31:40'),
(99, 'da', 8, 7, '2025-07-11 18:31:43'),
(100, 'sd', 8, 7, '2025-07-11 18:31:43'),
(101, 'asda', 8, 7, '2025-07-11 18:31:43'),
(102, 'sd', 8, 7, '2025-07-11 18:31:43'),
(103, 'asd', 8, 7, '2025-07-11 18:31:43'),
(104, 'asd', 8, 7, '2025-07-11 18:31:44'),
(105, 'a', 8, 7, '2025-07-11 18:31:44'),
(106, 'sd', 8, 7, '2025-07-11 18:31:44'),
(107, 'asd', 8, 7, '2025-07-11 18:31:44'),
(108, 'a', 8, 7, '2025-07-11 18:31:45'),
(109, 'sd', 8, 7, '2025-07-11 18:31:45'),
(110, 'asda', 8, 7, '2025-07-11 18:31:46'),
(111, 'sd', 8, 7, '2025-07-11 18:31:46'),
(112, 'as', 8, 7, '2025-07-11 18:31:46'),
(113, 'd', 8, 7, '2025-07-11 18:31:46'),
(114, 'asd', 8, 7, '2025-07-11 18:31:46'),
(115, 'asd', 8, 7, '2025-07-11 18:31:47'),
(116, 'asd', 8, 7, '2025-07-11 18:31:47'),
(117, 'asd', 8, 7, '2025-07-11 18:31:47'),
(118, 'a', 8, 7, '2025-07-11 18:31:47'),
(119, 'sd', 8, 7, '2025-07-11 18:31:48'),
(120, 'as', 8, 7, '2025-07-11 18:31:48'),
(121, 'da', 8, 7, '2025-07-11 18:31:48'),
(122, 'sd', 8, 7, '2025-07-11 18:31:48'),
(123, 'a', 8, 7, '2025-07-11 18:31:49'),
(124, 'sd', 8, 7, '2025-07-11 18:31:49'),
(125, 'asd', 8, 7, '2025-07-11 18:31:49'),
(126, 'a', 8, 7, '2025-07-11 18:31:49'),
(127, 'sd', 8, 7, '2025-07-11 18:31:49'),
(128, 'asd', 8, 7, '2025-07-11 18:31:50'),
(129, 'asd', 7, 8, '2025-07-11 18:31:51'),
(130, 'a', 7, 8, '2025-07-11 18:31:51'),
(131, 'sd', 7, 8, '2025-07-11 18:31:51'),
(132, 'as', 7, 8, '2025-07-11 18:31:51'),
(133, 'd', 7, 8, '2025-07-11 18:31:51'),
(134, 'asd', 7, 8, '2025-07-11 18:31:52'),
(135, 'a', 7, 8, '2025-07-11 18:31:52'),
(136, 'sd', 7, 8, '2025-07-11 18:31:52'),
(137, 'asd', 7, 8, '2025-07-11 18:31:52'),
(138, 'a', 7, 8, '2025-07-11 18:31:53'),
(139, 'sda', 7, 8, '2025-07-11 18:31:53'),
(140, 'sd', 7, 8, '2025-07-11 18:31:53'),
(141, 'a', 7, 8, '2025-07-11 18:31:53'),
(142, 'sd', 7, 8, '2025-07-11 18:31:53'),
(143, 'a', 7, 8, '2025-07-11 18:31:54'),
(144, 'sd', 7, 8, '2025-07-11 18:31:54'),
(145, 'as', 7, 8, '2025-07-11 18:31:54'),
(146, 'd', 7, 8, '2025-07-11 18:31:54'),
(147, 'asd', 7, 8, '2025-07-11 18:31:55'),
(148, 'a', 7, 8, '2025-07-11 18:31:55'),
(149, 'sd', 7, 8, '2025-07-11 18:31:55'),
(150, 'a', 7, 8, '2025-07-11 18:31:55'),
(151, 'sd', 7, 8, '2025-07-11 18:31:56'),
(152, 'as', 7, 8, '2025-07-11 18:31:56'),
(153, 'da', 7, 8, '2025-07-11 18:31:56'),
(154, 'sd', 7, 8, '2025-07-11 18:31:57'),
(155, 'asjdhjahsdhjasd', 8, 7, '2025-07-11 18:32:33'),
(156, 'sd', 8, 7, '2025-07-11 18:32:35'),
(157, 'asda', 8, 7, '2025-07-11 18:32:35'),
(158, 'sda', 8, 7, '2025-07-11 18:32:37'),
(159, 'as', 8, 7, '2025-07-11 18:32:42'),
(160, 'da', 8, 7, '2025-07-11 18:32:42'),
(161, 'asd', 8, 7, '2025-07-11 18:32:42'),
(162, 'asd', 8, 7, '2025-07-11 18:32:42'),
(163, 'asd', 8, 7, '2025-07-11 18:32:42'),
(164, 'sd', 8, 7, '2025-07-11 18:32:42'),
(165, 'a', 8, 7, '2025-07-11 18:32:42'),
(166, 'sda', 8, 7, '2025-07-11 18:32:42'),
(167, 'sda', 8, 7, '2025-07-11 18:32:44'),
(168, 'sarap', 8, 7, '2025-07-11 18:33:02'),
(169, 'sarap', 7, 8, '2025-07-11 18:33:09'),
(170, 'hi', 8, 7, '2025-07-12 02:51:39'),
(171, 'hsahdahsd', 7, 8, '2025-07-12 02:58:12'),
(172, 'asdasdasddasd', 7, 8, '2025-07-12 02:58:34'),
(173, 'asas', 8, 7, '2025-07-12 03:00:28'),
(174, 'asdasd', 7, 8, '2025-07-12 03:00:32'),
(175, 'asasa', 8, 7, '2025-07-12 03:00:53'),
(176, 'asd', 7, 8, '2025-07-12 03:01:36');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `otp_secret` varchar(255) DEFAULT NULL,
  `otp_created_at` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`, `first_name`, `last_name`, `bio`, `profile_picture_url`, `otp_secret`, `otp_created_at`, `is_verified`) VALUES
(7, 'jmjmjm@gmail.com', '$2b$10$4MTjdiLxikcntLk7Tx9wxOfgZUakPA0gORNeQFI1Ch8QRt4G8FUdm', '2025-07-10 03:09:48', 'John Michaels', 'sadasdasd', '', '/uploads/profile_pictures/7_1752144354306.jpg', '102102', NULL, 1),
(8, 'jg.jonatas.au@phinmaed.com', '$2b$10$u7.HKeasbKazpPbosYaqMOe8POnkklDpofncmejz9Qlh5U24ToCda', '2025-07-10 11:04:41', 'qwertyuasd', 'qwearstdyausd', '', '/uploads/profile_pictures/8_1752146068500.jpg', NULL, NULL, 1),
(9, 'ken.jie.kk12@gmail.com', '$2b$10$QNwi9c3MzYlVXRe79OlEyeajh8HOgx580S7BLGbVKMtRwL0a3cSBO', '2025-07-11 17:03:42', 'Kenjie', 'Jie', NULL, NULL, NULL, NULL, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=177;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
