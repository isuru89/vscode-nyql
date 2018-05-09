
import nyClient from "../client/nyClient";

export async function replaceQuery(data) {
  console.log(data);
  return nyClient.sendMessage({
    cmd: 'replacer',
    q: data.query,
    ps: data.params,
    order: data.order
  })
}