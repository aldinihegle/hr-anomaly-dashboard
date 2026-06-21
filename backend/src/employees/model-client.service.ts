import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ModelPredictResult {
  anomaly_score_if: number;
  risk_category: string;
  local_shap_top10: { feature: string; shap: number }[];
}

@Injectable()
export class ModelClientService {
  private readonly logger = new Logger(ModelClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('MODEL_SERVICE_URL') ?? 'http://localhost:8000';
  }

  async predict(employeeData: Record<string, unknown>): Promise<ModelPredictResult> {
    const url = `${this.baseUrl}/predict`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([employeeData]),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      this.logger.error(`Model service unreachable: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Model service tidak dapat dihubungi. Pastikan Flask berjalan di port 8000.');
    }

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Model service error ${res.status}: ${body}`);
      throw new ServiceUnavailableException(`Model service error: ${res.status}`);
    }

    const results = (await res.json()) as ModelPredictResult[];
    return results[0];
  }
}
