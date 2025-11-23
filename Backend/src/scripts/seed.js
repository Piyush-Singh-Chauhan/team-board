import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import bcrypt from 'bcrypt';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Starting database seeding...');

    await Card.deleteMany({});
    await Board.deleteMany({});
    await Team.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    const passwordHash = await bcrypt.hash('password123', 10);
    
    const user1 = await User.create({
      name: 'Piyush',
      email: 'piyush@gmail.com',
      passwordHash,
    });

    const user2 = await User.create({
      name: 'Mehul',
      email: 'mehul@gmail.com',
      passwordHash,
    });

    const user3 = await User.create({
      name: 'Amit',
      email: 'amit@gmail.com',
      passwordHash,
    });

    console.log('Created users');

    const team = await Team.create({
      name: 'Development Team',
      description: 'Main development team for TeamBoard project',
      members: [
        {
          userId: user1._id,
          role: 'owner',
          joinedAt: new Date(),
        },
        {
          userId: user2._id,
          role: 'admin',
          joinedAt: new Date(),
        },
        {
          userId: user3._id,
          role: 'member',
          joinedAt: new Date(),
        },
      ],
      createdBy: user1._id,
    });

    console.log('Created team');

    const board = await Board.create({
      teamId: team._id,
      name: 'Demo Board',
      description: ' Demo Tasks',
    });

    console.log('Created board');

    const dueDate1 = new Date();
    dueDate1.setDate(dueDate1.getDate() + 2);

    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() + 5);

    const card1 = await Card.create({
      boardId: board._id,
      columnId: 'todo',
      title: 'Demo Card 1',
      description: 'Demo Card 1 Description',
      status: 'todo',
      assignedTo: user1._id,
      priority: 'high',
      createdBy: user1._id,
    });

    const card2 = await Card.create({
      boardId: board._id,
      columnId: 'in-progress',
      title: 'Demo Card 2',
      description: 'Demo Card 2 Description',
      status: 'in-progress',
      assignedTo: user2._id,
      dueDate: dueDate1,
      priority: 'high',
      createdBy: user1._id,
    });

    const card3 = await Card.create({
      boardId: board._id,
      columnId: 'done',
      title: 'Demo Card 3',
      description: 'Demo Card 3 Description',
      status: 'done',
      assignedTo: user3._id,
      priority: 'medium',
      createdBy: user1._id,
    });

    const card4 = await Card.create({
      boardId: board._id,
      columnId: 'todo',
      title: 'Demo Card 4',
      description: 'Demo Card 4 Description',
      status: 'todo',
      assignedTo: user2._id,
      dueDate: dueDate2,
      priority: 'medium',
      createdBy: user1._id,
    });

    board.columns[0].cardOrder.push(card1._id);
    board.columns[1].cardOrder.push(card2._id);
    board.columns[2].cardOrder.push(card3._id);
    board.columns[0].cardOrder.push(card4._id);
    await board.save();

    console.log('Created cards');

    console.log('Seeding completed successfully!');
    console.log('Test Credentials:');
    console.log('Email: piyush@example.com');
    console.log('Password: password123');
    console.log('Email: mehul@example.com');
    console.log('Password: password123');
    console.log('Email: amit@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
