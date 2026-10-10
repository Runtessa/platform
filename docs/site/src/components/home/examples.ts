export const examples = [
  {
    id: 'backend', file: 'Modules/api/orders.js', language: 'javascript',
    code: `module.exports = async function handler(req, adapters) {
  const orm = await adapters.orm('postgres:orders');
  const orders = await orm.getRepository('Order').find({
    order: { createdAt: 'DESC' },
    take: 20,
  });

  return {
    statusCode: 200,
    body: { orders },
  };
};`,
  },
  {
    id: 'model', file: 'Models/Order.js', language: 'javascript',
    code: `const { Entity, PrimaryGeneratedColumn,
  Column, CreateDateColumn } = require('typeorm');

@Entity({ name: 'orders' })
class Order {
  @PrimaryGeneratedColumn('uuid') id;
  @Column({ type: 'varchar' }) title;
  @CreateDateColumn() createdAt;
}

module.exports = { Order };`,
  },
  {
    id: 'ui', file: 'UI Entities/@app/dashboard.jsx', language: 'jsx',
    code: `import React, { useState } from 'react';
import { useApiClient } from '@app/datacontext';

export function App() {
  const api = useApiClient();
  const [orders, setOrders] = useState([]);
  async function refresh() {
    const response = await api.get('/api/orders');
    if (!response.ok) throw new Error('Request failed');
    setOrders((await response.json()).orders);
  }
  return <section>
    <button onClick={refresh}>Load orders</button>
    {orders.map(order => <p key={order.id}>{order.title}</p>)}
  </section>;
}`,
  },
];
