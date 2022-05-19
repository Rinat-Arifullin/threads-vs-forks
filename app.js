const { Worker } = require("worker_threads");
const { fork } = require("child_process");
const { performance, PerformanceObserver } = require("perf_hooks");
const { readFileSync } = require("fs");

const file = readFileSync("./video.mp4");

const performanceObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}`);
  });
});

performanceObserver.observe({ entryTypes: ["measure"] });

const workerFunction = (array) => {
  return new Promise((resolve, reject) => {
    performance.mark("worker_start");
    const worker = new Worker("./worker.js", {
      workerData: { array, file },
    });

    worker.on("error", (err) => {
      console.log(`Ошибка в треде ${worker.threadId}`);
      reject(err);
    });

    worker.on("message", (msg) => {
      resolve(msg);
      performance.mark("worker_end");
      performance.measure("worker", "worker_start", "worker_end");
    });

    worker.on("exit", (code) => {
      console.log("Worker exit with code", code);
    });
  });
};

const forkFunction = (array) => {
  return new Promise((resolve, reject) => {
    performance.mark("fork_start");
    const forkProcess = fork("./fork.js");

    forkProcess.send({ array, file });

    forkProcess.on("message", (msg) => {
      resolve(msg);
      performance.mark("fork_end");
      performance.measure("fork", "fork_start", "fork_end");
    });

    forkProcess.on("exit", (code) => {
      console.log("Fork child process exit with code", code);
    });

    forkProcess.on("error", (err) => {
      reject(err);
    });
  });
};

const main = async () => {
  try {
    const workerResult = await workerFunction([25, 19, 48, 30]);
    const forkResult = await forkFunction([25, 19, 48, 30]);

    // console.log("Worker output", workerResult);
    // console.log("Fork output", forkResult);
  } catch (err) {
    console.error(err);
  }
};

main();
