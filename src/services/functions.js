const fs = require('fs');
const { Pool } = require('pg');

const { host, port, database, user, password } = require('../config/config.js').db;
const { jsonResponse } = require('../modules/utils');

const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
});

const queries = {
  // placeOrder: '',
  updateJson: 'SELECT * FROM "ecommerce"."posts"',
};

// TODO: unsequelize

// async function getUserID(userData) {
//   try {
//     const { email, phone } = userData;
//     const where = { email, phone };
//     const attributes = ['user_ID'];
//     let user = await Users.findOne({ attributes, where });
//     if (user) return user.user_ID;
//     user = await Users.create(where);
//     return user.user_ID;
//   } catch (err) {
//     console.error('Unable to get user id: ', err);
//   }
// }

// async function addOrders(user_ID, orders) {
//   try {
//     let { product_ID, quantity, delivery_address } = orders.pop();
//     const firstQuery = { user_ID, product_ID, quantity, delivery_address };
//     const firstOrder = await Orders.create(firstQuery);
//     const { order_ID } = firstOrder;
//     const orderArray = [];
//     orders.forEach(element => {
//       ({ product_ID, quantity, delivery_address } = element);
//       const order = {
//         order_ID,
//         user_ID,
//         product_ID,
//         quantity,
//         delivery_address,
//       };
//       orderArray.push(order);
//     });
//     await Orders.bulkCreate(orderArray);
//   } catch (err) {
//     console.error('Unable to add order: ', err);
//   }
// }

// async function postOrder(req, res) {
//   const { user, order } = req.body.message;
//   if (!req.body) return res.sendStatus(400);
//   user.phone = decodeURIComponent(user.phone);
//   user.email = decodeURIComponent(user.email);
//   const modifiedOrder = [];
//   order.forEach(el => {
//     const element = el;
//     element.delivery = decodeURIComponent(el.delivery);
//     modifiedOrder.push(element);
//   });
//   const userID = await getUserID(user);
//   const sendOrder = await addOrders(userID, modifiedOrder);
//   if (!userID || !sendOrder) return 0;
//   return 1;
// }

async function updateJson() {
  try {
    const client = await pool.connect();
    const products = await client.query(queries.updateJson);
    client.release();
    const { rows } = products;
    await fs.promises.writeFile(
      'public/static/data/products.json',
      JSON.stringify(rows, null, 2),
      'utf8'
    );
    return jsonResponse('All succefull!');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
}

const postTypes = {
  // '/api/order': postOrder,
  '/api/update_json': updateJson,
};

module.exports = { postTypes };
