
import { Request, Response } from "express";
import mongoose from "mongoose";
import Course from "../models/Course";
import cloudinary from "../config/cloudinary";

// Upload an image buffer to Cloudinary
const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "decent-learning/courses",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

// Delete an image from Cloudinary
const deleteCloudinaryImage = async (
  publicId?: string
): Promise<void> => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary image deletion error:", error);
  }
};

// Parse lessons if sent as JSON through FormData
const parseLessons = (lessons: unknown): unknown[] => {
  if (!lessons) return [];

  if (Array.isArray(lessons)) return lessons;

  if (typeof lessons === "string") {
    const parsed = JSON.parse(lessons);

    if (!Array.isArray(parsed)) {
      throw new Error("Lessons must be an array.");
    }

    return parsed;
  }

  throw new Error("Invalid lessons format.");
};

// Parse boolean values sent through FormData
const parseBoolean = (value: unknown): boolean => {
  return value === true || value === "true";
};

// CREATE COURSE
export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  let uploadedPublicId = "";

  try {
    const {
      title,
      slug,
      description,
      category,
      level,
      instructor,
      duration,
      isPublished,
    } = req.body;

    if (
      !title ||
      !slug ||
      !description ||
      !category ||
      !level ||
      !duration
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required course fields.",
      });
      return;
    }

    const normalizedSlug = slug.toLowerCase().trim();

    const existingCourse = await Course.findOne({
      slug: normalizedSlug,
    });

    if (existingCourse) {
      res.status(409).json({
        success: false,
        message: "A course with this slug already exists.",
      });
      return;
    }

    const lessons = parseLessons(req.body.lessons);

    let image = "";
    let imagePublicId = "";

    // Upload course image if provided
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file);

      image = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
      uploadedPublicId = imagePublicId;
    }

    const course = await Course.create({
      title: title.trim(),
      slug: normalizedSlug,
      description,
      category,
      level,
      image,
      imagePublicId,
      instructor: instructor || "Decent Learning",
      duration,
      lessons,
      isPublished: parseBoolean(isPublished),
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully.",
      data: course,
    });
  } catch (error) {
    // Remove uploaded image if course creation fails
    await deleteCloudinaryImage(uploadedPublicId);

    console.error("Create course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create course.",
    });
  }
};

// GET ALL PUBLISHED COURSES
export const getAllCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courses = await Course.find({
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully.",
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve courses.",
    });
  }
};

// GET COURSE BY SLUG
export const getCourseBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      slug: slug.toLowerCase(),
      isPublished: true,
    }).select("-__v");

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Course retrieved successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Get course by slug error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve course.",
    });
  }
};

// UPDATE COURSE
export const updateCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  let uploadedPublicId = "";

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found.",
      });
      return;
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "level",
      "instructor",
      "duration",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (course as any)[field] = req.body[field];
      }
    }

    if (req.body.slug !== undefined) {
      const normalizedSlug = req.body.slug.toLowerCase().trim();

      const existingCourse = await Course.findOne({
        slug: normalizedSlug,
        _id: { $ne: id },
      });

      if (existingCourse) {
        res.status(409).json({
          success: false,
          message: "Another course already uses this slug.",
        });
        return;
      }

      course.slug = normalizedSlug;
    }

    if (req.body.lessons !== undefined) {
      course.lessons = parseLessons(req.body.lessons) as any;
    }

    if (req.body.isPublished !== undefined) {
      course.isPublished = parseBoolean(req.body.isPublished);
    }

    // Replace image if a new one was uploaded
    const oldPublicId = course.imagePublicId;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file);

      uploadedPublicId = uploadedImage.public_id;

      course.image = uploadedImage.secure_url;
      course.imagePublicId = uploadedImage.public_id;
    }

    await course.save();

    // Delete old image only after successful database update
    if (req.file && oldPublicId) {
      await deleteCloudinaryImage(oldPublicId);
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course,
    });
  } catch (error) {
    // Clean up new upload if database update fails
    await deleteCloudinaryImage(uploadedPublicId);

    console.error("Update course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update course.",
    });
  }
};

// DELETE COURSE
export const deleteCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found.",
      });
      return;
    }

    await course.deleteOne();

    // Delete associated Cloudinary image
    await deleteCloudinaryImage(course.imagePublicId);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete course.",
    });
  }
};
