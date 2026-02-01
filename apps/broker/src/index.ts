import { runOrder } from "./commands/order";
import { runToken } from "./commands/token";

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "token": {
    const broker = args[1];
    if (!broker) {
      console.error("Usage: broker token <kis|kiwoom>");
      process.exit(1);
    }
    await runToken(broker);
    break;
  }
  case "order":
    await runOrder(args.slice(1));
    break;
  default:
    // 기존 호환: 인자가 broker 이름이면 token 커맨드로 처리
    if (command && ["kis", "kiwoom"].includes(command)) {
      await runToken(command);
    } else {
      console.error("Usage: broker <token|order> [options]");
      console.error("  token <kis|kiwoom>  — 토큰 발급");
      console.error("  order <add|list|cancel> — 주문 관리");
      process.exit(1);
    }
}
