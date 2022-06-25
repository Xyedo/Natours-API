import app from '@/app';
import server from '@/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import chai from 'chai';
import chaiHttp from 'chai-http';
chai.should();
chai.use(chaiHttp);
let mongod: MongoMemoryServer | null = null;
describe('Tour Integration Test', function () {
  before(async function () {
    mongod = await MongoMemoryServer.create();
    const mongodUri = mongod.getUri();
    const connectToDB = async () =>
      mongodUri && (await mongoose.connect(mongodUri));
    const con = await connectToDB();
    con &&
      console.log(
        `MongoDB connected: ${con.connection.host}:${con.connection.port}`
      );
    con.should.be.instanceOf(mongoose.Mongoose);
  });

  describe('Create Tours', () => {
    it('Create A new Tour Correctly', async function () {
      const name = 'The Great Valley';
      const duration = 20;
      const maxGroupSize = 10;
      const difficulty = 'easy';
      const price = 100;
      const summary = 'Valley is good for begineer';
      const imageCover = 'asdwdadsada';
      const res = await chai.request(app).post('/api/v1/tours').send({
        name,
        duration,
        maxGroupSize,
        difficulty,
        price,
        summary,
        imageCover,
      });
      res.should.have.status(201);
      (res.body.data.tour as object).should.have.property('name').eql(name);
      (res.body.data.tour as object).should.have
        .property('duration')
        .eql(duration);
      (res.body.data.tour as object).should.have
        .property('maxGroupSize')
        .eql(maxGroupSize);
      (res.body.data.tour as object).should.have
        .property('difficulty')
        .eql(difficulty);
      (res.body.data.tour as object).should.have
        .property('imageCover')
        .eql(imageCover);
      (res.body.data.tour as object).should.have.property('price').eql(price);
      (res.body.data.tour as object).should.have
        .property('summary')
        .eql(summary);
    });
    it('Get one Tour that has been created', async function() {
      const name = 'The Great Valley';
      const duration = 20;
      const maxGroupSize = 10;
      const difficulty = 'easy';
      const price = 100;
      const summary = 'Valley is good for begineer';
      const imageCover = 'asdwdadsada';
      const res = await chai
        .request(app)
        .get('/api/v1/tours')
        .set('Accept', 'application/json');

      res.should.have.status(200);
      res.body.should.have.ownProperty('status').eql('success');
      res.body.should.have.ownProperty('results').eql(1);
      res.body.should.have.ownProperty('data');
      (res.body.data as object).should.have
        .ownProperty('tours')
        .to.be.a('array');
      (res.body.data.tours[0] as object).should.have.property('name').eql(name);

      (res.body.data.tours[0] as object).should.have
        .property('duration')
        .eql(duration);
      (res.body.data.tours[0] as object).should.have
        .property('maxGroupSize')
        .eql(maxGroupSize);
      (res.body.data.tours[0] as object).should.have
        .property('difficulty')
        .eql(difficulty);
      (res.body.data.tours[0] as object).should.have
        .property('imageCover')
        .eql(imageCover);
      (res.body.data.tours[0] as object).should.have
        .property('price')
        .eql(price);

      (res.body.data.tours[0] as object).should.have
        .property('summary')
        .eql(summary);
    });
    it('Create a new Tour with the same name', async function(){
      const name = 'The Great Valley';
      const duration = 50;
      const maxGroupSize = 200;
      const difficulty = 'medium';
      const price = 560;
      const summary = 'Valley is good for begineer';
      const imageCover = 'asdwdadsada';
      const res = await chai.request(app)
        .post('/api/v1/tours')
        .send({
          name,
          duration,
          maxGroupSize,
          difficulty,
          price,
          summary,
          imageCover,
        })
        
      res.should.have.status(400);
      (res.body as object).should.have.property("status").eql("error");
      (res.body as object).should.have.property("message").eql("Please correct the following Error:")
    });
  });

  after(async () => {
    try {
      await mongoose.connection.close();
      if (mongod) {
        await mongod.stop();
      }
    } catch (err) {
      console.log(err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
});
