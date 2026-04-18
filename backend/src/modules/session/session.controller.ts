import type { Request, Response } from 'express';
import { SessionService } from './session.service.js';

export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  async create(req: Request, res: Response) {
    try {
      const { quiz_id } = req.body;
      if (!quiz_id) {
        return res.status(400).json({ message: 'quiz_id is required' });
      }

      const result = await this.sessionService.createSession(quiz_id);

      return res.status(201).json({
        data: {
          session_id: result.gameRoomId,
          game_room_id: result.gameRoomId,
          pin: result.pin,
          quiz_title: result.quizTitle,
          master_token: result.masterToken
        }
      });
    } catch (error: any) {
      if (error.message === 'Quiz not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { pin } = req.params;
      if (!pin) {
        return res.status(400).json({ message: 'pin is required' });
      }
      const session = await this.sessionService.getSession(pin as string);

      if (!session) {
        return res.status(404).json({ message: 'Session not found or completed' });
      }

      return res.status(200).json({
        data: {
          game_room_id: session.id,
          quiz_title: session.quizTitle,
          status: session.status,
          player_count: session.playerCount
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
