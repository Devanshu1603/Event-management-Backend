const corsOptions = {
  origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3002','https://event-management-backend-gamma.vercel.app', 'https://tourism-five-azure.vercel.app'], // Adjust this based on where your frontend is running
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization','Content-Type'],
  credentials: true,
};