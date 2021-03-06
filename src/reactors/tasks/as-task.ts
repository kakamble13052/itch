import * as uuid from "uuid";
import { throttle } from "underscore";

import { IStore, IProgressInfo, Cancelled } from "../../types";
import { DB } from "../../db";
import Context from "../../context";
import * as actions from "../../actions";

import { caveLogger } from "../../os/paths";
import rootLogger, { Logger } from "../../logger";

interface IAsTaskOpts {
  store: IStore;
  db: DB;
  name: TaskName;
  gameId: number;
  // non-optional on purpose, think before passing null here
  caveId: string;
  work: (ctx: Context, logger: Logger) => Promise<void>;
}

interface ITaskMap {
  [id: string]: Context;
}

let currentTasks = {} as ITaskMap;

type TaskName = "install" | "launch" | "uninstall";

export default async function asTask(opts: IAsTaskOpts) {
  const id = uuid.v4();

  const { store, db, name, gameId, caveId } = opts;

  let logger: Logger;
  if (caveId) {
    logger = caveLogger(caveId);
  } else {
    // FIXME: WELL ACTUALLY it should be a custom logger
    // so we can copy it to the cave's log afterwards.
    logger = rootLogger;
  }

  store.dispatch(
    actions.taskStarted({
      id,
      name,
      gameId,
      startedAt: Date.now(),
    }),
  );

  const ctx = new Context(store, db);
  ctx.on(
    "progress",
    throttle((ev: IProgressInfo) => {
      store.dispatch(actions.taskProgress({ id, ...ev }));
    }, 250),
  );

  currentTasks[id] = ctx;

  let err: Error;

  opts
    .work(ctx, logger)
    .catch(e => {
      err = e;
    })
    .then(() => {
      delete currentTasks[id];
      if (err) {
        if (err instanceof Cancelled) {
          // all good, but also, don't trigger taskEnded
          return;
        } else {
          rootLogger.warn(`Task ${name} threw: ${err.stack}`);
        }
      }

      store.dispatch(
        actions.taskEnded({
          id,
          err: err ? `${err}` : null,
        }),
      );
    });
}

export const getCurrentTasks = () => currentTasks;
