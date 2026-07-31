import { runningTextRepository } from './running-text.repository';
import { themeService } from '../theme/theme.service';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class RunningTextService {
  async getRunningTexts() {
    const list = await runningTextRepository.findAll();
    const activeThemeResult = await themeService.getActiveTheme();
    const isHoliday = activeThemeResult.activeTheme !== 'NORMAL';
    const holidayEmojis = activeThemeResult.metadata.emojis;

    return list.map((item, idx) => {
      let emoji = '🟢';
      if (item.category === 'TRAINING') emoji = '🟡';
      else if (item.category === 'BUSINESS') emoji = '🔵';
      else if (item.category === 'GENERAL') emoji = '🟢';

      // Override with holiday emoji if holiday theme is active
      if (isHoliday && holidayEmojis.length > 0) {
        emoji = holidayEmojis[idx % holidayEmojis.length];
      }

      return {
        ...item,
        emoji,
      };
    });
  }

  async createRunningText(data: any, performedBy = 'ADMIN') {
    const created = await runningTextRepository.create(data);
    logAudit('CREATE_RUNNING_TEXT', 'RunningText', created.id, performedBy, { text: created.text });
    emitContentUpdate('running-text', created);
    return created;
  }

  async updateRunningText(id: string, data: any, performedBy = 'ADMIN') {
    const updated = await runningTextRepository.update(id, data);
    logAudit('UPDATE_RUNNING_TEXT', 'RunningText', updated.id, performedBy, { text: updated.text });
    emitContentUpdate('running-text', updated);
    return updated;
  }

  async deleteRunningText(id: string, performedBy = 'ADMIN') {
    const deleted = await runningTextRepository.delete(id);
    logAudit('DELETE_RUNNING_TEXT', 'RunningText', id, performedBy, { text: deleted.text });
    emitContentUpdate('running-text', { id, deleted: true });
    return deleted;
  }
}

export const runningTextService = new RunningTextService();
