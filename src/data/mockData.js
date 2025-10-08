// Mock data for salon booking platform

// Centralized salon data - used across all components
export const featuredSalons = [
  {
    id: 1,
    name: "Luxe Beauty Studio",
    image: "/s1.jpeg",
    rating: 4.9,
    reviewCount: 156,
    price: "₹₹₹",
    services: ["Hair", "Nails", "Facial"],
    address: "123 Main St, Downtown",
    distance: "0.5 miles",
    isOpen: true,
    nextAvailable: "Today 2:00 PM",
    specialOffer: "20% off first visit"
  },
  {
    id: 2,
    name: "Serenity Spa & Salon",
    image: "/s2.jpeg",
    rating: 4.8,
    reviewCount: 203,
    price: "₹₹",
    services: ["Massage", "Facial", "Hair"],
    address: "456 Oak Ave, Midtown",
    distance: "1.2 miles",
    isOpen: true,
    nextAvailable: "Tomorrow 10:00 AM"
  },
  {
    id: 3,
    name: "The Glam House",
    image: "/s3.jpeg",
    rating: 4.7,
    reviewCount: 89,
    price: "₹₹₹",
    services: ["Hair Color", "Extensions", "Styling"],
    address: "789 Elm St, Uptown",
    distance: "2.1 miles",
    isOpen: false,
    nextAvailable: "Tomorrow 9:00 AM",
    closingTime: "Closes 6:00 PM"
  },
  {
    id: 4,
    name: "Bella Vista Salon",
    image: "/s4.jpeg",
    rating: 4.6,
    reviewCount: 124,
    price: "₹₹",
    services: ["Cut & Style", "Color", "Treatments"],
    address: "321 Maple Dr, Westside",
    distance: "1.8 miles",
    isOpen: true,
    nextAvailable: "Today 4:30 PM"
  },
  {
    id: 5,
    name: "Urban Retreat Spa",
    image: "/api/placeholder/280/180",
    rating: 4.5,
    reviewCount: 98,
    price: "₹₹₹₹",
    services: ["Luxury Spa", "Massage", "Wellness"],
    address: "555 Broadway, Central",
    distance: "3.0 miles",
    isOpen: true,
    nextAvailable: "Today 6:00 PM"
  },
  {
    id: 6,
    name: "Classic Cuts",
    image: "/api/placeholder/280/180",
    rating: 4.4,
    reviewCount: 76,
    price: "₹",
    services: ["Haircuts", "Shaves", "Styling"],
    address: "888 Pine St, Northside",
    distance: "2.5 miles",
    isOpen: true,
    nextAvailable: "Tomorrow 11:00 AM"
  },
  {
    id: 7,
    name: "Bliss Beauty Bar",
    image: "/api/placeholder/280/180",
    rating: 4.8,
    reviewCount: 142,
    price: "₹₹₹",
    services: ["Nails", "Lashes", "Brows"],
    address: "222 Cedar Ave, Eastside",
    distance: "1.9 miles",
    isOpen: true,
    nextAvailable: "Today 3:30 PM"
  },
  {
    id: 8,
    name: "Platinum Hair Studio",
    image: "/api/placeholder/280/180",
    rating: 4.7,
    reviewCount: 167,
    price: "₹₹₹₹",
    services: ["Color", "Highlights", "Treatments"],
    address: "999 Oak Lane, Southside",
    distance: "2.8 miles",
    isOpen: false,
    nextAvailable: "Tomorrow 10:30 AM",
    closingTime: "Closes 7:00 PM"
  }
];

export const serviceCategories = [
  { id: 1, name: "Haircut & Styling", count: 45 },
  { id: 2, name: "Hair Color", count: 32 },
  { id: 3, name: "Facial & Skincare", count: 28 },
  { id: 4, name: "Manicure & Pedicure", count: 38 },
  { id: 5, name: "Makeup", count: 24 },
  { id: 6, name: "Spa & Massage", count: 19 },
  { id: 7, name: "Waxing & Threading", count: 41 },
  { id: 8, name: "Bridal Services", count: 15 }
];

export const priceRanges = [
  { id: 1, label: "Under ₹500", value: "0-500" },
  { id: 2, label: "₹500 - ₹1000", value: "500-1000" },
  { id: 3, label: "₹1000 - ₹2000", value: "1000-2000" },
  { id: 4, label: "₹2000 - ₹5000", value: "2000-5000" },
  { id: 5, label: "Above ₹5000", value: "5000+" }
];

export const salonDetails = {
  1: {
    id: 1,
    name: "Luxe Beauty Studio",
    images: ["/s1.jpeg", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "123 Connaught Place, New Delhi, 110001",
    phone: "+91 9876543210",
    email: "contact@glamourstudio.com",
    description: "Experience luxury and style at Glamour Studio. We offer premium beauty services with experienced professionals in a modern, hygienic environment.",
    rating: 4.8,
    reviewCount: 128,
    openingHours: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "11:00 AM - 7:00 PM"
    },
    services: [
      { id: 1, name: "Women's Haircut", price: 800, duration: "45 min" },
      { id: 2, name: "Men's Haircut", price: 500, duration: "30 min" },
      { id: 3, name: "Hair Color (Full)", price: 2500, duration: "2 hours" },
      { id: 4, name: "Facial (Gold)", price: 1200, duration: "60 min" },
      { id: 5, name: "Manicure", price: 600, duration: "45 min" },
      { id: 6, name: "Pedicure", price: 800, duration: "60 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Priya Sharma",
        image: "/api/placeholder/150/150",
        specialties: ["Hair Styling", "Hair Color"],
        experience: "5 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "Rohit Kumar",
        image: "/api/placeholder/150/150",
        specialties: ["Men's Haircut", "Beard Styling"],
        experience: "3 years",
        rating: 4.7
      },
      {
        id: 3,
        name: "Sneha Patel",
        image: "/api/placeholder/150/150",
        specialties: ["Facial", "Skincare"],
        experience: "4 years",
        rating: 4.8
      }
    ]
  },
  2: {
    id: 2,
    name: "Serenity Spa & Salon",
    images: ["/s2.jpeg", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "456 Oak Ave, Midtown",
    phone: "+91 9876543211",
    email: "contact@serenityspa.com",
    description: "Unwind and rejuvenate at Serenity Spa & Salon. Our expert therapists provide relaxing massage, facial, and hair services in a tranquil environment.",
    rating: 4.8,
    reviewCount: 203,
    openingHours: {
      monday: "9:00 AM - 8:00 PM",
      tuesday: "9:00 AM - 8:00 PM",
      wednesday: "9:00 AM - 8:00 PM",
      thursday: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 9:00 PM",
      saturday: "8:00 AM - 9:00 PM",
      sunday: "10:00 AM - 7:00 PM"
    },
    services: [
      { id: 1, name: "Swedish Massage", price: 1500, duration: "60 min" },
      { id: 2, name: "Deep Cleansing Facial", price: 1000, duration: "75 min" },
      { id: 3, name: "Hair Cut & Style", price: 700, duration: "45 min" },
      { id: 4, name: "Hot Stone Massage", price: 2000, duration: "90 min" },
      { id: 5, name: "Anti-Aging Facial", price: 1800, duration: "90 min" },
      { id: 6, name: "Hair Wash & Blow Dry", price: 400, duration: "30 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Maya Johnson",
        image: "/api/placeholder/150/150",
        specialties: ["Massage Therapy", "Aromatherapy"],
        experience: "6 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "David Chen",
        image: "/api/placeholder/150/150",
        specialties: ["Hair Styling", "Color Correction"],
        experience: "4 years",
        rating: 4.7
      }
    ]
  },
  3: {
    id: 3,
    name: "The Glam House",
    images: ["/s3.jpeg", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "789 Elm St, Uptown",
    phone: "+91 9876543212",
    email: "hello@glamhouse.com",
    description: "Transform your look at The Glam House. Specializing in hair color, extensions, and avant-garde styling for the fashion-forward client.",
    rating: 4.7,
    reviewCount: 89,
    openingHours: {
      monday: "10:00 AM - 6:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "Closed"
    },
    services: [
      { id: 1, name: "Hair Color (Full)", price: 2800, duration: "3 hours" },
      { id: 2, name: "Hair Extensions", price: 4500, duration: "4 hours" },
      { id: 3, name: "Creative Styling", price: 1200, duration: "60 min" },
      { id: 4, name: "Balayage", price: 3200, duration: "3.5 hours" },
      { id: 5, name: "Hair Treatments", price: 1500, duration: "90 min" },
      { id: 6, name: "Consultation", price: 200, duration: "30 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Isabella Rodriguez",
        image: "/api/placeholder/150/150",
        specialties: ["Hair Color", "Extensions"],
        experience: "8 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "Marcus Thompson",
        image: "/api/placeholder/150/150",
        specialties: ["Creative Styling", "Avant-garde"],
        experience: "5 years",
        rating: 4.8
      }
    ]
  },
  4: {
    id: 4,
    name: "Bella Vista Salon",
    images: ["/s4.jpeg", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "321 Maple Dr, Westside",
    phone: "+91 9876543213",
    email: "info@bellavista.com",
    description: "Classic beauty meets modern techniques at Bella Vista Salon. We offer traditional cuts, styling, color, and treatments in a warm, welcoming atmosphere.",
    rating: 4.6,
    reviewCount: 124,
    openingHours: {
      monday: "9:00 AM - 7:00 PM",
      tuesday: "9:00 AM - 7:00 PM",
      wednesday: "9:00 AM - 7:00 PM",
      thursday: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 8:00 PM",
      saturday: "8:00 AM - 8:00 PM",
      sunday: "10:00 AM - 6:00 PM"
    },
    services: [
      { id: 1, name: "Classic Cut & Style", price: 650, duration: "45 min" },
      { id: 2, name: "Hair Color Touch-up", price: 1200, duration: "90 min" },
      { id: 3, name: "Keratin Treatment", price: 2200, duration: "3 hours" },
      { id: 4, name: "Blowout", price: 450, duration: "30 min" },
      { id: 5, name: "Hair Highlights", price: 1800, duration: "2.5 hours" },
      { id: 6, name: "Trim & Style", price: 400, duration: "30 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Sofia Martinez",
        image: "/api/placeholder/150/150",
        specialties: ["Classic Cuts", "Color"],
        experience: "7 years",
        rating: 4.8
      },
      {
        id: 2,
        name: "James Wilson",
        image: "/api/placeholder/150/150",
        specialties: ["Styling", "Treatments"],
        experience: "4 years",
        rating: 4.6
      }
    ]
  },
  5: {
    id: 5,
    name: "Urban Retreat Spa",
    images: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "555 Broadway, Central",
    phone: "+91 9876543214",
    email: "info@urbanretreat.com",
    description: "Escape to Urban Retreat Spa for the ultimate luxury wellness experience. Our premium spa services and expert therapists provide a tranquil oasis in the heart of the city.",
    rating: 4.5,
    reviewCount: 98,
    openingHours: {
      monday: "10:00 AM - 9:00 PM",
      tuesday: "10:00 AM - 9:00 PM",
      wednesday: "10:00 AM - 9:00 PM",
      thursday: "10:00 AM - 9:00 PM",
      friday: "10:00 AM - 10:00 PM",
      saturday: "9:00 AM - 10:00 PM",
      sunday: "10:00 AM - 8:00 PM"
    },
    services: [
      { id: 1, name: "Premium Massage", price: 3500, duration: "90 min" },
      { id: 2, name: "Luxury Facial", price: 2500, duration: "75 min" },
      { id: 3, name: "Body Wrap", price: 4000, duration: "2 hours" },
      { id: 4, name: "Couples Massage", price: 6500, duration: "90 min" },
      { id: 5, name: "Aromatherapy", price: 3000, duration: "60 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Elena Thompson",
        image: "/api/placeholder/150/150",
        specialties: ["Luxury Spa", "Aromatherapy"],
        experience: "10 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "Michael Roberts",
        image: "/api/placeholder/150/150",
        specialties: ["Massage Therapy", "Wellness"],
        experience: "8 years",
        rating: 4.7
      }
    ]
  },
  6: {
    id: 6,
    name: "Classic Cuts",
    images: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "888 Pine St, Northside",
    phone: "+91 9876543215",
    email: "hello@classiccuts.com",
    description: "Classic Cuts offers traditional barbering and modern styling services. Our experienced barbers provide quality cuts and grooming services in a friendly, welcoming atmosphere.",
    rating: 4.4,
    reviewCount: 76,
    openingHours: {
      monday: "8:00 AM - 7:00 PM",
      tuesday: "8:00 AM - 7:00 PM",
      wednesday: "8:00 AM - 7:00 PM",
      thursday: "8:00 AM - 8:00 PM",
      friday: "8:00 AM - 8:00 PM",
      saturday: "7:00 AM - 8:00 PM",
      sunday: "9:00 AM - 6:00 PM"
    },
    services: [
      { id: 1, name: "Classic Haircut", price: 350, duration: "30 min" },
      { id: 2, name: "Beard Trim", price: 200, duration: "20 min" },
      { id: 3, name: "Hair Wash & Style", price: 300, duration: "25 min" },
      { id: 4, name: "Shave", price: 250, duration: "25 min" },
      { id: 5, name: "Hair & Beard Combo", price: 500, duration: "45 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Tony Martinelli",
        image: "/api/placeholder/150/150",
        specialties: ["Classic Cuts", "Beard Styling"],
        experience: "15 years",
        rating: 4.8
      },
      {
        id: 2,
        name: "Jake Anderson",
        image: "/api/placeholder/150/150",
        specialties: ["Modern Styling", "Shaves"],
        experience: "6 years",
        rating: 4.5
      }
    ]
  },
  7: {
    id: 7,
    name: "Bliss Beauty Bar",
    images: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "222 Cedar Ave, Eastside",
    phone: "+91 9876543216",
    email: "contact@blissbeauty.com",
    description: "Bliss Beauty Bar specializes in nail care, lash extensions, and eyebrow services. Our skilled technicians provide precision beauty treatments in a chic, modern setting.",
    rating: 4.8,
    reviewCount: 142,
    openingHours: {
      monday: "9:00 AM - 8:00 PM",
      tuesday: "9:00 AM - 8:00 PM",
      wednesday: "9:00 AM - 8:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 9:00 PM",
      saturday: "8:00 AM - 9:00 PM",
      sunday: "10:00 AM - 7:00 PM"
    },
    services: [
      { id: 1, name: "Gel Manicure", price: 800, duration: "45 min" },
      { id: 2, name: "Lash Extensions", price: 2500, duration: "2 hours" },
      { id: 3, name: "Eyebrow Threading", price: 300, duration: "15 min" },
      { id: 4, name: "Pedicure", price: 1000, duration: "60 min" },
      { id: 5, name: "Lash Refill", price: 1200, duration: "60 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Amanda Lee",
        image: "/api/placeholder/150/150",
        specialties: ["Lash Extensions", "Brow Shaping"],
        experience: "7 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "Sarah Kim",
        image: "/api/placeholder/150/150",
        specialties: ["Nail Art", "Manicures"],
        experience: "5 years",
        rating: 4.7
      }
    ]
  },
  8: {
    id: 8,
    name: "Platinum Hair Studio",
    images: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"],
    address: "999 Oak Lane, Southside",
    phone: "+91 9876543217",
    email: "info@platinumhair.com",
    description: "Platinum Hair Studio is a premium destination for advanced hair coloring, highlights, and treatments. Our master colorists create stunning, personalized looks using the latest techniques.",
    rating: 4.7,
    reviewCount: 167,
    openingHours: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 9:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "Closed"
    },
    services: [
      { id: 1, name: "Premium Color", price: 4500, duration: "3.5 hours" },
      { id: 2, name: "Balayage Highlights", price: 5000, duration: "4 hours" },
      { id: 3, name: "Hair Treatments", price: 2500, duration: "90 min" },
      { id: 4, name: "Color Correction", price: 6000, duration: "5 hours" },
      { id: 5, name: "Glossing Treatment", price: 1800, duration: "60 min" }
    ],
    staff: [
      {
        id: 1,
        name: "Victoria Chang",
        image: "/api/placeholder/150/150",
        specialties: ["Color Correction", "Balayage"],
        experience: "12 years",
        rating: 4.9
      },
      {
        id: 2,
        name: "Daniel Foster",
        image: "/api/placeholder/150/150",
        specialties: ["Premium Color", "Treatments"],
        experience: "9 years",
        rating: 4.8
      }
    ]
  }
};

export const reviews = [
  {
    id: 1,
    salonId: 1,
    customerName: "Anita Singh",
    rating: 5,
    date: "2024-03-15",
    comment: "Excellent service! Priya did an amazing job with my hair color. Very professional and clean salon.",
    service: "Hair Color"
  },
  {
    id: 2,
    salonId: 1,
    customerName: "Raj Mehta",
    rating: 4,
    date: "2024-03-10",
    comment: "Good haircut by Rohit. Quick service and reasonable pricing. Will come back again.",
    service: "Men's Haircut"
  },
  {
    id: 3,
    salonId: 1,
    customerName: "Kavya Reddy",
    rating: 5,
    date: "2024-03-08",
    comment: "Best facial I've had in Delhi! Sneha is very skilled and the ambiance is great.",
    service: "Facial"
  }
];
