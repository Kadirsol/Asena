import {
  type ComponentParams,
  ComponentType,
  type ControllerParams,
  type ScheduleParams,
  type ServiceParams,
} from '../../ioc/types';
import { defineMetadata, getMetadata } from 'reflect-metadata/no-conflict';
import { CronKey, IsMiddlewareKey, MiddlewaresKey, OverrideKey, PathKey } from '../../ioc/constants';
import { parseCron } from '../../ioc/helper/cronParser';
import { defineComponent } from '../../ioc/component/component';
import { defineMiddleware } from '../web/helper/defineMiddleware';
import type { MiddlewareParams } from '../../ioc/types/decorators/MiddlewareParams.ts';

export const Component = (params?: ComponentParams | string): ClassDecorator => {
  return defineComponent(ComponentType.COMPONENT, params);
};

export const Service = (params?: ServiceParams | string): ClassDecorator => {
  return defineComponent(ComponentType.SERVICE, params);
};

export const Controller = (params?: ControllerParams | string): ClassDecorator => {
  const _params =
    typeof params === 'string' ? { path: params, name: undefined } : params || { path: '', name: undefined };

  return defineComponent(ComponentType.CONTROLLER, _params, (target) => {
    defineMetadata(PathKey, (_params as ControllerParams).path || '', target);

    defineMiddleware(target, (_params as ControllerParams).middlewares || []);

    defineMetadata(MiddlewaresKey, (_params as ControllerParams).middlewares || [], target);
  });
};

export const ServerService = (params?: ComponentParams): ClassDecorator => {
  return defineComponent(ComponentType.SERVER_SERVICE, params);
};

export const Schedule = (params: ScheduleParams): ClassDecorator => {
  return defineComponent(ComponentType.SCHEDULE, params, (target) => {
    const cronParsed = parseCron((params as ScheduleParams).cron);

    defineMetadata(CronKey, cronParsed, target);
  });
};

export const Middleware = (params?: MiddlewareParams): ClassDecorator => {
  return defineComponent(ComponentType.MIDDLEWARE, params, (target) => {
    defineMetadata(IsMiddlewareKey, true, target);

    const overdrive = getMetadata(OverrideKey, target);

    defineMetadata(OverrideKey, overdrive || params?.override || false, target);

    if (typeof target.prototype.handle !== 'function') {
      throw new Error(`Class ${target.name} must implement a 'filter(req, res, next)' method.`);
    }
  });
};

export const Override = (): ClassDecorator => {
  return (target: Function) => {
    defineMetadata(OverrideKey, true, target);
  };
};
