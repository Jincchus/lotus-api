import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: string; // YYYY-MM-DD

  @Column({ name: 'usd_to_krw', type: 'decimal', precision: 18, scale: 4 })
  usdToKrw: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
