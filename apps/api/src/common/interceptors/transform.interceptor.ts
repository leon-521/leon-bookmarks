import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

/**
 * Wraps all successful responses in a standardized { data, meta } envelope.
 * If the handler already returns an object with a `data` key and a `meta` key,
 * it passes through unchanged to allow controllers to set pagination metadata.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If the response already has data/meta shape, pass through
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'meta' in response
        ) {
          return response;
        }

        return { data: response, meta: {} };
      }),
    );
  }
}
