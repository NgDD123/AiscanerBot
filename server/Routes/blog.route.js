const express = require('express');
const { uploadBlogImage, createBlog, getAllBlogs, getBlogById, deleteBlog, updateBlog } = require('../controllers/blog');
const { checkIfAdmin, verifyToken } = require('../config/middlewares');
const blogRoute = express.Router();


blogRoute.post('/create', verifyToken, checkIfAdmin, uploadBlogImage, createBlog);
blogRoute.delete('/delete/:id', verifyToken, deleteBlog);
blogRoute.get('/all', verifyToken, getAllBlogs);
blogRoute.get('/by-id/:id', verifyToken, getBlogById);
blogRoute.patch("/update-blog/:blogId",verifyToken,updateBlog);
module.exports = blogRoute;