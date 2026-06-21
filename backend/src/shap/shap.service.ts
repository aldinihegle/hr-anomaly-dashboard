import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShapGlobalImportance } from './shap-global.entity';
import { ShapLocal } from './shap-local.entity';

@Injectable()
export class ShapService {
  constructor(
    @InjectRepository(ShapGlobalImportance)
    private readonly globalRepo: Repository<ShapGlobalImportance>,
    @InjectRepository(ShapLocal)
    private readonly localRepo: Repository<ShapLocal>,
  ) {}

  async findGlobal(top = 10) {
    return this.globalRepo.find({
      order: { meanAbsShap: 'DESC' },
      take: Math.min(top, 100),
    });
  }

  async findLocal(employeeId: number, top = 10) {
    // employeeId is 1-based (DB id). If DB was re-seeded, IDs might shift (e.g. 1471+).
    // Modulo 1470 ensures we always hit a valid 0-1469 index in the shap_local table.
    const employeeIdx = (employeeId - 1) % 1470;
    
    const rows = await this.localRepo.find({
      where: { employeeIdx },
      order: { shapValue: 'DESC' },
    });
    
    // sort by |shapValue| descending, take top N
    return rows
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, Math.min(top, 50));
  }
}
