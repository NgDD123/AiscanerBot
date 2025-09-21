const admin = require("firebase-admin");
const { db, collection, addDoc, updateDoc, getDocs, initFirebase, doc } = require("../firebase");
const multer = require('multer');
const logger = require("../utils/util.logger");
const blogsLogger = logger("/blogs");
const { getDoc, deleteDoc } = require("firebase/firestore");

initFirebase();

const bucket = admin.storage().bucket("freedmobot.appspot.com");
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        blogsLogger.warn(`Rejected file upload: Invalid file type - ${file.mimetype}`);
        cb(new Error("Only image files are allowed"), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

const getRef = async (type, docId) => {
    blogsLogger.info(`Fetching reference for type: ${type}, docId: ${docId}`);
    let collectionInstance;
    switch (type) {
        case "create":
            collectionInstance = collection(db, "blogs");
            break;
        case "update":
        case "delete":
        case "byId":
            collectionInstance = doc(db, "blogs", docId);
            break;
        default:
            collectionInstance = collection(db, "blogs");
    }
    return collectionInstance;
};

// Helper function to upload to Firebase Storage
const uploadToFirebase = async (file, filename) => {
    blogsLogger.info(`Uploading file to Firebase: ${filename}`);
    const fileRef = bucket.file(filename);
    const blobStream = fileRef.createWriteStream({
        metadata: { contentType: file.mimetype },
    });

    await new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
            blogsLogger.error(`File upload error: ${error.message}`);
            reject(error);
        });
        blobStream.on("finish", () => {
            blogsLogger.info(`File uploaded successfully: ${filename}`);
            resolve();
        });
        blobStream.end(file.buffer);
    });

    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
};

const uploadBlogImage = upload.single('photo');

const createBlog = async (req, res) => {
    blogsLogger.info("Processing blog creation request...");
    const { mainContent } = req.body;

    if (!mainContent) {
        blogsLogger.error("Blog creation failed: No main content provided");
        return res.status(400).json({
            status: false,
            message: "Main content is required",
        });
    }

    try {
        const bannerFile = req.file;
        blogsLogger.info(`Uploading banner image for blog creation: ${bannerFile.originalname}`);
        const imgUrl = await uploadToFirebase(bannerFile, bannerFile.originalname);
        
        const blogModel = await getRef("create");
        await addDoc(blogModel, { mainContent, imgUrl });

        blogsLogger.info("Blog created successfully");
        return res.status(200).json({
            status: true,
            message: "Blog created successfully",
        });
    } catch (error) {
        blogsLogger.error(`Error creating blog: ${error.message}`);
        res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

const getAllBlogs = async (req, res) => {
    blogsLogger.info("Fetching all blogs...");
    try {
        const blogModel = await getRef();
        const blogs = await getDocs(blogModel);

        blogsLogger.info("Fetched all blogs successfully");
        return res.status(200).json({
            status: true,
            message: "All blogs",
            data: blogs.docs.map((doc) => ({ data: doc.data(), id: doc.id })),
        });
    } catch (error) {
        blogsLogger.error(`Error fetching blogs: ${error.message}`);
        res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

const getBlogById = async (req, res) => {
    const { id } = req.params;
    blogsLogger.info(`Fetching blog by ID: ${id}`);

    if (!id) {
        blogsLogger.error("Blog ID is missing in the request");
        return res.status(400).json({
            status: false,
            message: "Id is required",
        });
    }

    try {
        const blogRef = await getRef("byId", id);
        const blogSnapshot = await getDoc(blogRef);

        if (!blogSnapshot.exists()) {
            blogsLogger.warn(`Blog not found with ID: ${id}`);
            return res.status(404).json({
                status: false,
                message: "Blog not found",
            });
        }

        blogsLogger.info(`Blog fetched successfully with ID: ${id}`);
        return res.status(200).json({
            status: true,
            message: "Blog retrieved successfully",
            data: blogSnapshot.data(),
        });
    } catch (error) {
        blogsLogger.error(`Error fetching blog by ID: ${error.message}`);
        res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

const updateBlog = async (req, res) => {
    const { blogId } = req.params;
    blogsLogger.info(`Updating blog with ID: ${blogId}`);

    if (!blogId) {
        blogsLogger.error("Blog ID is missing in the request");
        return res.status(400).json({
            status: false,
            message: "Blog id is required",
        });
    }

    try {
        const { mainContent } = req.body;

        if (!mainContent) {
            blogsLogger.error("Blog update failed: No main content provided");
            return res.status(400).json({
                status: false,
                message: "Main content is required",
            });
        }

        const blogModel = await getRef("update", blogId);
        await updateDoc(blogModel, { mainContent });

        blogsLogger.info(`Blog updated successfully with ID: ${blogId}`);
        return res.status(200).json({
            status: true,
            message: "Blog updated successfully",
        });
    } catch (error) {
        blogsLogger.error(`Error updating blog: ${error.message}`);
        res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

const deleteBlog = async (req, res) => {
    const { id } = req.params;
    blogsLogger.info(`Deleting blog with ID: ${id}`);

    if (!id) {
        blogsLogger.error("Blog ID is missing in the request");
        return res.status(400).json({
            status: false,
            message: "Blog id is required",
        });
    }

    try {
        const blogModel = await getRef("delete", id);
        await deleteDoc(blogModel);

        blogsLogger.info(`Blog deleted successfully with ID: ${id}`);
        return res.status(200).json({
            status: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        blogsLogger.error(`Error deleting blog: ${error.message}`);
        res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

module.exports = {
    createBlog,
    uploadBlogImage,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
};
