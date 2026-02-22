/**
 * @luneo/virtual-try-on - Camera Manager professionnel
 * Gestion complète de l'accès caméra avec permissions
 */

import type { CameraOptions } from './types';
import type { Logger } from '../utils/Logger';

/**
 * État de la caméra
 */
export type CameraState = 'idle' | 'requesting' | 'granted' | 'denied' | 'active' | 'error';

/**
 * Informations sur la caméra
 */
export interface CameraInfo {
  /** ID du device */
  deviceId: string;
  
  /** Label du device */
  label: string;
  
  /** Type (user = selfie, environment = arrière) */
  kind: 'videoinput';
  
  /** Résolution supportée */
  capabilities?: MediaTrackCapabilities;
}

/**
 * Camera Manager professionnel
 * 
 * Features:
 * - Permission handling
 * - Device selection
 * - Stream management
 * - Resolution handling
 * - Error recovery
 * 
 * @example
 * ```typescript
 * const camera = new CameraManager({
 *   facingMode: 'user',
 *   width: 1280,
 *   height: 720,
 *   frameRate: 30
 * }, logger);
 * 
 * await camera.init();
 * await camera.start();
 * 
 * const videoElement = camera.getVideoElement();
 * ```
 */
export class CameraManager {
  private state: CameraState = 'idle';
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private selectedDevice: CameraInfo | null = null;
  private options: Required<CameraOptions>;

  constructor(
    options: CameraOptions,
    private logger: Logger
  ) {
    this.options = {
      facingMode: options.facingMode || 'user',
      width: options.width || 1280,
      height: options.height || 720,
      frameRate: options.frameRate || 30,
    };
    
    this.logger.debug('CameraManager created', this.options);
  }

  /**
   * Initialise la caméra (demande permissions)
   */
  async init(): Promise<void> {
    try {
      this.logger.info('Initializing camera...');
      this.state = 'requesting';
      
      // Vérifier support MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      // Demander permission
      this.logger.debug('Requesting camera permission...');
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      
      // Permission accordée
      this.state = 'granted';
      this.logger.info('✅ Camera permission granted');
      
      // Arrêter le stream temporaire
      tempStream.getTracks().forEach(track => track.stop());
      
      // Lister les devices disponibles
      await this.listDevices();
      
    } catch (error: any) {
      this.state = 'denied';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.logger.error('Camera permission denied by user');
        throw new Error('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        this.logger.error('No camera found');
        throw new Error('No camera found');
      } else if (error.name === 'NotReadableError') {
        this.logger.error('Camera already in use');
        throw new Error('Camera in use by another application');
      } else {
        this.logger.error('Camera initialization failed:', error);
        throw error;
      }
    }
  }

  /**
   * Démarre le stream vidéo
   */
  async start(): Promise<void> {
    if (this.state !== 'granted') {
      throw new Error('Camera must be initialized before starting');
    }
    
    try {
      this.logger.info('Starting camera stream...');
      
      // Créer constraints
      const constraints = this.buildConstraints();
      this.logger.debug('Camera constraints:', constraints);
      
      // Obtenir le stream
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Créer video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true; // Important pour iOS
      
      // Attendre que la vidéo soit prête
      await new Promise<void>((resolve, reject) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play()
            .then(() => resolve())
            .catch(reject);
        };
        
        // Timeout 5 secondes
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });
      
      this.state = 'active';
      this.logger.info('✅ Camera stream active', {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
      });
      
    } catch (error) {
      this.state = 'error';
      this.logger.error('Failed to start camera stream:', error);
      throw error;
    }
  }

  /**
   * Arrête le stream vidéo
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping camera stream...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        this.logger.debug(`Stopped track: ${track.label}`);
      });
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.state = 'granted';
    this.logger.info('✅ Camera stream stopped');
  }

  /**
   * Change de caméra (front/back)
   */
  async switchCamera(): Promise<void> {
    const newFacingMode = this.options.facingMode === 'user' ? 'environment' : 'user';
    this.logger.info(`Switching camera to ${newFacingMode}...`);
    
    this.options.facingMode = newFacingMode;
    
    // Redémarrer avec nouvelle caméra
    await this.stop();
    await this.start();
    
    this.logger.info('✅ Camera switched');
  }

  /**
   * Obtient le video element
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Obtient le stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Obtient l'état actuel
   */
  getState(): CameraState {
    return this.state;
  }

  /**
   * Vérifie si la caméra est active
   */
  isActive(): boolean {
    return this.state === 'active' && this.stream !== null;
  }

  /**
   * Obtient les devices disponibles
   */
  async listDevices(): Promise<CameraInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
        kind: device.kind as 'videoinput',
      }));
    
    this.logger.debug(`Found ${videoDevices.length} camera(s)`, videoDevices);
    return videoDevices;
  }

  /**
   * Sélectionne un device spécifique
   */
  selectDevice(deviceId: string): void {
    this.logger.info(`Selecting device: ${deviceId}`);
    // TODO: Implémenter sélection device
  }

  /**
   * Obtient la résolution actuelle
   */
  getResolution(): { width: number; height: number } | null {
    if (!this.videoElement) {
      return null;
    }
    
    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
    };
  }

  /**
   * Construit les constraints MediaStream
   */
  private buildConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode: this.options.facingMode,
        width: { ideal: this.options.width },
        height: { ideal: this.options.height },
        frameRate: { ideal: this.options.frameRate },
      },
      audio: false,
    };
  }
}

