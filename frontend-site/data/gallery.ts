export type GalleryItem = {
  src: string;
  caption: string;
};

/**
 * GALLERY — add your real photos here later.
 *
 * To add a photo:
 * 1. Drop the image file into `public/images/gallery/`
 * 2. Add an entry below with the filename and a caption.
 * 3. Redeploy on Vercel. Done!
 */
export const galleryItems: GalleryItem[] = [
  { src: "/images/gallery/reception.svg", caption: "Reception & Welcome Desk" },
  { src: "/images/gallery/group-class.svg", caption: "Group Classes Area" },
  { src: "/images/gallery/workout-area.svg", caption: "Workout Area" },
  { src: "/images/gallery/outdoor.svg", caption: "Outdoor Sitting Area" },
  { src: "/images/gallery/yoga.svg", caption: "Yoga Session Space" },
  { src: "/images/gallery/equipment.svg", caption: "High-Tech Equipment" },
  { src: "/images/gallery/martial-arts.svg", caption: "Martial Arts Training" },
  { src: "/images/gallery/members.svg", caption: "Our Members" },
];
