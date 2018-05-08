import {spawn, ChildProcess} from 'child_process';
import * as vscode from "vscode";
import * as path from 'path';
import Axios from "axios";

const PORT: Number = 9887;
const URL:string = 'http://localhost:' + PORT;

class NyClient {

  private javaProc: ChildProcess;

  start(extPath: string) {
    return this.startProcess(extPath)
      .then(r => {
        return new Promise((resolve, reject) => {
          Axios.post(URL, {
            cmd: 'ping'
          }).then(res => resolve(res.data))
          .catch(err => reject(err))
        });
      });
  }

  startProcess(extPath: string) {
    return new Promise((resolve, reject) => {
      console.log(extPath);
      let started = false;
      let dirs = path.join(extPath, 'node_modules/ace-builds/src-min')
      let jfile = path.normalize(path.join(extPath, 'utils/target/vscode-nyql.jar'));
      this.javaProc = spawn('java', ['-jar', jfile, '-p',  PORT.toString(), '-f', dirs]);
      console.log("Spawned process: ", this.javaProc.pid);
      this.javaProc.stdout.on('data', (data) => {
        const line = data.toString().trim();
        if (!started) {
          console.log('[NY-HELP]', line);
        }
        if (started == false && line === 'Server OK') {
          started = true;
          console.log('resolving...')
          return resolve(this);
        }
      })
      this.javaProc.stderr.on('data', (data) => {
        if (started == false) {
          return reject(this);
        }
        console.log("[NY-HELP] Error: ", data.toString());
      })
    })
  }

  async sendMessage(command:any) {
    const response = await Axios.post(URL, command)
    return response.data;
  }

  async close() {
    await Axios.post(URL, { cmd: 'exit' });
  }

}

const client = new NyClient();
export default client;