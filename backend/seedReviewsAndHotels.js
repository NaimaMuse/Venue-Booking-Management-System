require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Hall = require('./models/Hall');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const { updateHotelRating } = require('./controllers/reviewController');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/venue-booking';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find or create customer users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const customer1 = await User.findOneAndUpdate(
    { email: 'rahma.moktar122@gmail.com' },
    {
      fullName: 'Rahma Moktar',
      email: 'rahma.moktar122@gmail.com',
      phone: '+252 63 4441122',
      role: 'customer',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const customer2 = await User.findOneAndUpdate(
    { email: 'naima@gmail.com' },
    {
      fullName: 'Naima Ahmed',
      email: 'naima@gmail.com',
      phone: '+252 63 4443344',
      role: 'customer',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const customer3 = await User.findOneAndUpdate(
    { email: 'jama.farah@gmail.com' },
    {
      fullName: 'Jama Farah',
      email: 'jama.farah@gmail.com',
      phone: '+252 63 4445566',
      role: 'customer',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  // Find or create owners
  const owner1 = await User.findOneAndUpdate(
    { email: 'ahmed@gmail.com' },
    {
      fullName: 'Ahmed Hassan',
      email: 'ahmed@gmail.com',
      phone: '+252 63 4001122',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner2 = await User.findOneAndUpdate(
    { email: 'mansoor.owner@gmail.com' },
    {
      fullName: 'Mansoor Hotel Group',
      email: 'mansoor.owner@gmail.com',
      phone: '+252 63 4002233',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner3 = await User.findOneAndUpdate(
    { email: 'ambassador.owner@gmail.com' },
    {
      fullName: 'Ambassador Hotel Group',
      email: 'ambassador.owner@gmail.com',
      phone: '+252 63 4003344',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner4 = await User.findOneAndUpdate(
    { email: 'damal.owner@gmail.com' },
    {
      fullName: 'Damal Hotel Management',
      email: 'damal.owner@gmail.com',
      phone: '+252 63 4004455',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner5 = await User.findOneAndUpdate(
    { email: 'oriental.owner@gmail.com' },
    {
      fullName: 'Oriental Hotel Group',
      email: 'oriental.owner@gmail.com',
      phone: '+252 63 4005566',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner6 = await User.findOneAndUpdate(
    { email: 'maansoor.owner@gmail.com' },
    {
      fullName: 'Maan-Soor Hospitality',
      email: 'maansoor.owner@gmail.com',
      phone: '+252 63 4006677',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner7 = await User.findOneAndUpdate(
    { email: 'crown.owner@gmail.com' },
    {
      fullName: 'Crown Hotel Management',
      email: 'crown.owner@gmail.com',
      phone: '+252 63 4007788',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  const owner8 = await User.findOneAndUpdate(
    { email: 'safari.owner@gmail.com' },
    {
      fullName: 'Safari Plaza Group',
      email: 'safari.owner@gmail.com',
      phone: '+252 63 4008899',
      role: 'hotel_owner',
      password: passwordHash,
    },
    { upsert: true, new: true }
  );

  // Hotels Data
  const hotelsData = [
    {
      ownerId: owner1._id,
      hotelName: 'Moole Hotel',
      city: 'Hargeisa',
      address: 'Jidka 150, Downtown',
      contactPhone: '+252 63 4001122',
      description: 'Premier luxury hotel and event destination in central Hargeisa with modern banquet facilities.',
      coverImage: '/hotel-hero-moole.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner2._id,
      hotelName: 'Mansoor Grand Hotel',
      city: 'Hargeisa',
      address: 'Shaab Area, Airport Road',
      contactPhone: '+252 63 4002233',
      description: 'Elegant five-star hospitality featuring grand conference halls and wedding ballrooms.',
      coverImage: '/banner01.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner3._id,
      hotelName: 'Ambassador Palace Hotel',
      city: 'Hargeisa',
      address: 'Airport Road, Hargeisa',
      contactPhone: '+252 63 4003344',
      description: 'Luxury hotel with expansive outdoor gardens and VIP banquet halls.',
      coverImage: '/banner02.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner4._id,
      hotelName: 'Damal City Hotel',
      city: 'Hargeisa',
      address: 'Freedom Square, Hargeisa',
      contactPhone: '+252 63 4004455',
      description: 'Contemporary boutique hotel with panoramic views and state-of-the-art event spaces.',
      coverImage: '/banner03.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner5._id,
      hotelName: 'Oriental Suites & Halls',
      city: 'Hargeisa',
      address: 'Jigjiga Yar, Hargeisa',
      contactPhone: '+252 63 4005566',
      description: 'Historic charm paired with modern amenities, catering for conferences and private celebrations.',
      coverImage: '/banner.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner6._id,
      hotelName: 'Maan-Soor Royal Hotel',
      city: 'Hargeisa',
      address: 'West End Hills, Hargeisa',
      contactPhone: '+252 63 4006677',
      description: 'Prestigious venue featuring world-class event spaces and banquet catering.',
      coverImage: '/banner01.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner7._id,
      hotelName: 'Crown Regency Hotel',
      city: 'Hargeisa',
      address: 'Independence Avenue, Hargeisa',
      contactPhone: '+252 63 4007788',
      description: 'Sophisticated event suites and banquet rooms for unforgettable celebrations.',
      coverImage: '/banner02.png',
      verificationStatus: 'approved',
    },
    {
      ownerId: owner8._id,
      hotelName: 'Safari Plaza Hotel',
      city: 'Hargeisa',
      address: 'New Hargeisa Boulevard',
      contactPhone: '+252 63 4008899',
      description: 'Spacious venues with state-of-the-art audiovisual equipment and ample parking.',
      coverImage: '/banner03.png',
      verificationStatus: 'approved',
    },
  ];

  const seededHotels = [];
  for (const hd of hotelsData) {
    let hotel = await Hotel.findOne({ hotelName: hd.hotelName });
    if (!hotel) {
      hotel = await Hotel.create(hd);
    } else {
      hotel.verificationStatus = 'approved';
      hotel.coverImage = hd.coverImage;
      hotel.description = hd.description;
      hotel.address = hd.address;
      hotel.contactPhone = hd.contactPhone;
      await hotel.save();
    }
    seededHotels.push(hotel);
  }

  // Ensure each hotel has at least 1-2 halls
  for (const hotel of seededHotels) {
    const existingHalls = await Hall.find({ hotelId: hotel._id });
    if (existingHalls.length === 0) {
      await Hall.create({
        hotelId: hotel._id,
        hallName: `${hotel.hotelName.split(' ')[0]} Grand Ballroom`,
        capacity: 500,
        pricePerDay: 850,
        description: `Spacious, fully air-conditioned ballroom with high ceilings and chandeliers at ${hotel.hotelName}.`,
        amenities: ['Air Conditioning', 'VIP Stage', 'Audio/Visual Sound System', 'Dedicated Catering Area'],
        images: [hotel.coverImage || '/banner01.png'],
        isAvailable: true,
      });

      await Hall.create({
        hotelId: hotel._id,
        hallName: `${hotel.hotelName.split(' ')[0]} Executive Suite`,
        capacity: 200,
        pricePerDay: 450,
        description: `Ideal for intimate gatherings, conferences, and engagement parties at ${hotel.hotelName}.`,
        amenities: ['Air Conditioning', 'Projector & Screens', 'WiFi', 'PA System'],
        images: [hotel.coverImage || '/banner02.png'],
        isAvailable: true,
      });
    }
  }

  // Create completed bookings for customers in the past (eligible for reviews)
  // Booking 1: Rahma at Moole Hotel (Past - Confirmed)
  const pastDate1 = new Date();
  pastDate1.setDate(pastDate1.getDate() - 5);

  const pastDate2 = new Date();
  pastDate2.setDate(pastDate2.getDate() - 12);

  const pastDate3 = new Date();
  pastDate3.setDate(pastDate3.getDate() - 20);

  const pastDate4 = new Date();
  pastDate4.setDate(pastDate4.getDate() - 8);

  const hall1 = await Hall.findOne({ hotelId: seededHotels[0]._id });
  const hall2 = await Hall.findOne({ hotelId: seededHotels[1]._id });
  const hall3 = await Hall.findOne({ hotelId: seededHotels[2]._id });
  const hall4 = await Hall.findOne({ hotelId: seededHotels[3]._id });

  // Booking for Rahma at Moole Hotel
  let b1 = await Booking.findOne({
    customerId: customer1._id,
    hotelId: seededHotels[0]._id,
    status: 'confirmed',
    eventDate: { $lte: new Date() },
  });
  if (!b1 && hall1) {
    b1 = await Booking.create({
      customerId: customer1._id,
      hallId: hall1._id,
      hotelId: seededHotels[0]._id,
      eventDate: pastDate1,
      guestCount: 300,
      status: 'confirmed',
      depositPaid: true,
      depositAmount: 400,
      bookingAmount: 850,
      specialNotes: 'Wedding reception with custom floral arrangement.',
    });
  }

  // Booking for Rahma at Mansoor Grand Hotel (Eligible but NOT yet reviewed - customer can test writing review!)
  let b2 = await Booking.findOne({
    customerId: customer1._id,
    hotelId: seededHotels[1]._id,
    status: 'confirmed',
    eventDate: { $lte: new Date() },
  });
  if (!b2 && hall2) {
    b2 = await Booking.create({
      customerId: customer1._id,
      hallId: hall2._id,
      hotelId: seededHotels[1]._id,
      eventDate: pastDate2,
      guestCount: 250,
      status: 'confirmed',
      depositPaid: true,
      depositAmount: 350,
      bookingAmount: 800,
      specialNotes: 'Corporate annual gala dinner.',
    });
  }

  // Booking for Naima at Mansoor Grand Hotel
  let b3 = await Booking.findOne({
    customerId: customer2._id,
    hotelId: seededHotels[1]._id,
    status: 'confirmed',
  });
  if (!b3 && hall2) {
    b3 = await Booking.create({
      customerId: customer2._id,
      hallId: hall2._id,
      hotelId: seededHotels[1]._id,
      eventDate: pastDate3,
      guestCount: 400,
      status: 'confirmed',
      depositPaid: true,
      depositAmount: 500,
      bookingAmount: 900,
    });
  }

  // Booking for Jama at Ambassador Palace Hotel
  let b4 = await Booking.findOne({
    customerId: customer3._id,
    hotelId: seededHotels[2]._id,
    status: 'confirmed',
  });
  if (!b4 && hall3) {
    b4 = await Booking.create({
      customerId: customer3._id,
      hallId: hall3._id,
      hotelId: seededHotels[2]._id,
      eventDate: pastDate4,
      guestCount: 350,
      status: 'confirmed',
      depositPaid: true,
      depositAmount: 450,
      bookingAmount: 950,
    });
  }

  // Seed sample verified reviews
  if (b1) {
    const r1 = await Review.findOneAndUpdate(
      { bookingId: b1._id },
      {
        hotelId: seededHotels[0]._id,
        customerId: customer1._id,
        bookingId: b1._id,
        rating: 5,
        comment: 'Outstanding hospitality and breathtaking ballroom! The management went above and beyond for our event. Highly recommended!',
      },
      { upsert: true, new: true }
    );
  }

  if (b3) {
    const r3 = await Review.findOneAndUpdate(
      { bookingId: b3._id },
      {
        hotelId: seededHotels[1]._id,
        customerId: customer2._id,
        bookingId: b3._id,
        rating: 5,
        comment: 'Mansoor Grand Hotel provided exceptional service. Sound system, lighting, and guest catering were truly 5-star.',
      },
      { upsert: true, new: true }
    );
  }

  if (b4) {
    const r4 = await Review.findOneAndUpdate(
      { bookingId: b4._id },
      {
        hotelId: seededHotels[2]._id,
        customerId: customer3._id,
        bookingId: b4._id,
        rating: 4,
        comment: 'Beautiful outdoor and indoor hall setting. Very helpful staff and seamless booking process through HallHub.',
      },
      { upsert: true, new: true }
    );
  }

  // Seed reviews for other hotels to have distinct ratings
  // For Damal: 4 stars
  let b5 = await Booking.findOne({ hotelId: seededHotels[3]._id, status: 'confirmed' });
  if (!b5 && hall4) {
    b5 = await Booking.create({
      customerId: customer2._id,
      hallId: hall4._id,
      hotelId: seededHotels[3]._id,
      eventDate: pastDate3,
      guestCount: 150,
      status: 'confirmed',
      depositPaid: true,
      bookingAmount: 500,
    });
  }
  if (b5) {
    await Review.findOneAndUpdate(
      { bookingId: b5._id },
      {
        hotelId: seededHotels[3]._id,
        customerId: customer2._id,
        bookingId: b5._id,
        rating: 4,
        comment: 'Very modern venue with great city views. Everything went smoothly.',
      },
      { upsert: true }
    );
  }

  // Update ratings for all hotels
  for (const h of seededHotels) {
    await updateHotelRating(h._id);
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
