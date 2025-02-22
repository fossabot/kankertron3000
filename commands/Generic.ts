import { Command, CommandMessage, Infos } from '@typeit/discord';
import db from '../plugins/firebase';
import Markov from 'js-markov';
import * as axiosTemp from 'axios';
const axios = axiosTemp.default;

export abstract class Say {
  // Get current players from minecraft server
  @Command('mc')
  @Infos({
    command: 'mc',
    detail: '`$mc`',
    description: '* Get the details about Loudness Refugee Minecraft server',
  })
  async getMcStatus(command: CommandMessage): Promise<void> {
    try {
      const res = await axios.get(
        'https://mcapi.us/server/status?ip=blockgame.invertedsilence.com'
      );
      let str =
        '**Loudness Refuge Minecraft Server**\n' +
        '`blockgame.invertedsilence.com`';

      if (await res.data.online) {
        const activeUsers: Promise<Array<Record<string, unknown>>> = await res
          .data.players.sample;
        const activeUsersCount: Promise<number> = await res.data.players.now;
        let activePlayers = '';

        (await activeUsers).forEach((n) => {
          activePlayers += `+ ${n.name}\n`;
        });

        str +=
          '\n\n```diff\nCurrent Players\n\n' +
          activeUsersCount +
          ' Playing\n\n' +
          activePlayers +
          '```';
      } else {
        str += '```diff\n- Server Offline\n```';
      }
      command.channel.send(
        'http://mcapi.us/server/image?ip=blockgame.invertedsilence.com&theme=dark&title=LoudnessRefuge'
      );
      command.channel.send(str);
    } catch (error) {
      console.log(`[${new Date()}] ERROR`);
      console.log(error);
    }
  }

  // say saus
  @Command('saus')
  @Infos({
    command: `saus`,
    detail: '`$saus`',
    description: '* Gratis Saus',
  })
  async saus(command: CommandMessage): Promise<void> {
    command.channel.send('gratis saus');
  }

  @Command('donate')
  @Infos({
    command: `donate`,
    detail: '`$donate`',
    description: '* Donate to Titancube! https://paypal.me/titancube',
  })
  private async donate(command: CommandMessage): Promise<void> {
    command.channel.send(`
Donate to Titancube for more features! ➡ https://paypal.me/titancube
    `);
  }

  // imitates target person
  @Command('say :mPerson :mHistory :mCount')
  @Infos({
    command: `say`,
    detail: `\`$say <Mention> <History?: default 50> <Count?: default 15>\``,
    description:
      "* Speaks randomly generated sentence depends on the mentioned person's chat history\n* Message will be generated with the amount of maximum words specified with `<Count>` based on number of histories specifed with `<History>`\n* If the person mentioned usually says short words, the result is also likely to be short\n* `<Count>` **limits** the maximum words, not forcing it",
  })
  private async say(command: CommandMessage): Promise<void> {
    const { mPerson, mHistory, mCount } = command.args;
    const history = mHistory ? Math.floor(mHistory) : 50;
    const person = this.userStringParser(mPerson);
    const count = mCount ? Math.floor(mCount) : 15;
    console.log(
      `[${new Date()}] User: ${person} | History: ${history} | Count: ${count}`
    );

    if (history > 1000 || history < 0) {
      command.channel.send(
        'Count of message history cannot be higher than 1000 or lower than 0'
      );
      return;
    }

    if (person === '') {
      command.channel.send('Invalid user');
    }

    const wordsToTrain = [];
    const markov = new Markov();
    const samples = await db
      .collection('Member')
      .doc(person)
      .collection('Messages')
      .orderBy('createdAt', 'desc')
      .limit(history)
      .get();

    if (samples) {
      samples.forEach((r) => {
        wordsToTrain.push(r.data().message);
      });

      markov.addStates(wordsToTrain);
      markov.train();
      const theWiseWord: string = markov.generateRandom(count);
      theWiseWord.length
        ? command.channel.send(theWiseWord)
        : command.channel.send('No message was generated, try again!');
    }
  }

  private userStringParser(user: string) {
    const validate = new RegExp(/([0-9])+/g);

    if (!user) {
      return '';
    } else {
      return validate.exec(user)[0];
    }
  }
}
