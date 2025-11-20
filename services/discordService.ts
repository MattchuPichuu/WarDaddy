
import { Player, PlayerStatus } from "../types";
import { calculateProWindows, getRemainingTime } from "../utils/timeUtils";

export const postWarBoardToDiscord = async (
  webhookUrl: string,
  friendlies: Player[],
  enemies: Player[],
  serverTime: number
): Promise<boolean> => {
  
  const formatPlayerLine = (p: Player) => {
    let statusIcon = '🟢'; // Default Open/Safe-ish
    let timeInfo = 'OPEN';
    
    if (p.status === PlayerStatus.DEAD) {
      statusIcon = '💀';
      timeInfo = 'DEAD';
    } else if (p.lastShotTime) {
      const windows = calculateProWindows(p.lastShotTime);
      if (serverTime < windows.start) {
        statusIcon = '🛡️'; // Protected
        timeInfo = `Safe for ${getRemainingTime(windows.start, serverTime)}`;
      } else if (serverTime >= windows.start && serverTime < windows.end) {
        statusIcon = '⚠️'; // Dropping
        timeInfo = `DROPPING: ${getRemainingTime(windows.end, serverTime)}`;
      } else {
        statusIcon = '🟢'; // Open
        timeInfo = 'OPEN';
      }
    }

    const namePart = p.discordId && p.faction === 'FRIENDLY' 
      ? `${p.name} (<@${p.discordId}>)` 
      : p.name;

    return `${statusIcon} **${namePart}** — ${timeInfo}`;
  };

  const friendlyLines = friendlies.map(formatPlayerLine).join('\n');
  const enemyLines = enemies.map(formatPlayerLine).join('\n');

  const embed = {
    title: "🛑 WAR DADDY BOARD UPDATE",
    color: 3447003, // Blue-ish
    description: `Server Time: ${new Date(serverTime).toUTCString()}`,
    fields: [
      {
        name: "🔵 FRIENDLIES",
        value: friendlyLines || "No data",
        inline: false
      },
      {
        name: "🔴 ENEMIES",
        value: enemyLines || "No data",
        inline: false
      }
    ],
    footer: {
      text: "War Daddy Protection System"
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "War Daddy",
        avatar_url: "https://media1.tenor.com/m/0y122eQ8E8AAAAAC/robot-mech.gif",
        embeds: [embed]
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to post to Discord", error);
    return false;
  }
};
