import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ModelTrainerService } from './model-trainer.service';
import { DatasetManagerService } from './dataset-manager.service';

@ApiTags('AI Studio - Fine-Tuning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio/fine-tuning')
export class FineTuningController {
  constructor(
    private readonly trainerService: ModelTrainerService,
    private readonly datasetService: DatasetManagerService,
  ) {}

  @Post('models')
  @ApiOperation({ summary: 'Start fine-tuning a new model' })
  async startTraining(
    @Body()
    body: {
      brandId: string;
      name: string;
      displayName?: string;
      description?: string;
      baseModel?: string;
      technique?: string;
      trainingImages: string[];
      triggerWord?: string;
      trainingSteps?: number;
      learningRate?: number;
    },
    @Req() req: any,
  ) {
    return this.trainerService.startTraining({
      organizationId: req.user.organizationId || req.user.id,
      ...body,
    });
  }

  @Get('models')
  @ApiOperation({ summary: 'List fine-tuned models' })
  async listModels(@Req() req: any, @Query('brandId') brandId?: string) {
    return this.trainerService.listModels(req.user.organizationId || req.user.id, brandId);
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get fine-tuned model details' })
  async getModel(@Param('id') id: string, @Req() req: any) {
    return this.trainerService.getModel(id, req.user.organizationId || req.user.id);
  }

  @Get('models/:id/progress')
  @ApiOperation({ summary: 'Get training progress' })
  async getProgress(@Param('id') id: string) {
    return this.trainerService.getTrainingProgress(id);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Archive a fine-tuned model' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteModel(@Param('id') id: string, @Req() req: any) {
    return this.trainerService.deleteModel(id, req.user.organizationId || req.user.id);
  }

  @Post('datasets/validate')
  @ApiOperation({ summary: 'Validate training dataset' })
  async validateDataset(@Body() body: { imageUrls: string[] }) {
    return this.datasetService.validateDataset(body.imageUrls);
  }

  @Post('datasets/prepare')
  @ApiOperation({ summary: 'Prepare dataset for training' })
  async prepareDataset(@Body() body: { imageUrls: string[] }) {
    return this.datasetService.prepareDataset(body.imageUrls);
  }
}
