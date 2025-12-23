import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from './index';

declare global {
    namespace Express {
        interface User extends IUserDocument { }
        interface Request {
            user?: IUserDocument;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: IUserDocument;
}

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
