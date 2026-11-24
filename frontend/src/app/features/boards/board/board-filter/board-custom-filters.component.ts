//-- copyright
// OpenProject is an open source project management software.
// Copyright (C) the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
//
// See COPYRIGHT and LICENSE files for more details.
//++

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { BoardActionsRegistryService } from 'core-app/features/boards/board/board-actions/board-actions-registry.service';
import { BoardFiltersService } from 'core-app/features/boards/board/board-filter/board-filters.service';
import { BoardService } from 'core-app/features/boards/board/board.service';
import { Board, BoardCustomFilter } from 'core-app/features/boards/board/board';
import { HalResourceNotificationService } from 'core-app/features/hal/services/hal-resource-notification.service';
import { ToastService } from 'core-app/shared/components/toaster/toast.service';
import { UntilDestroyedMixin } from 'core-app/shared/helpers/angular/until-destroyed.mixin';

@Component({
  selector: 'op-board-custom-filters',
  templateUrl: './board-custom-filters.component.html',
  styleUrls: ['./board-custom-filters.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BoardCustomFiltersComponent extends UntilDestroyedMixin implements OnInit {
  private readonly boardActionsRegistry = inject(BoardActionsRegistryService);
  private readonly boardFilters = inject(BoardFiltersService);
  private readonly boards = inject(BoardService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly halNotification = inject(HalResourceNotificationService);
  private readonly toastService = inject(ToastService);
  private readonly I18n = inject(I18nService);

  @Input() board:Board;

  customFilters:BoardCustomFilter[] = [];

  removingFilterIds = new Set<string>();

  readonly text = {
    label: this.I18n.t('js.boards.custom_filters.label'),
    delete: this.I18n.t('js.boards.custom_filters.delete'),
    confirmDelete: this.I18n.t('js.boards.custom_filters.confirm_delete'),
    updateSuccessful: this.I18n.t('js.notice_successful_update'),
  };

  ngOnInit():void {
    const actionAttribute = this.board.actionAttribute;
    const protectedFilterNames = this.board.isAction && actionAttribute
      ? this.boardActionsRegistry.get(actionAttribute).filterNames
      : [];

    this.boardFilters.initializeCustomFilters(this.board.customFilters, protectedFilterNames);
    this.boardFilters.customFilters.values$()
      .pipe(this.untilDestroyed())
      .subscribe((customFilters) => {
        this.customFilters = customFilters;
        this.cdRef.markForCheck();
      });
  }

  toggle(customFilter:BoardCustomFilter):void {
    this.boardFilters.toggleCustomFilter(customFilter.id);
  }

  isActive(customFilter:BoardCustomFilter):boolean {
    return this.boardFilters.isCustomFilterActive(customFilter.id);
  }

  remove(customFilter:BoardCustomFilter):void {
    if (this.removingFilterIds.size > 0 || !window.confirm(this.text.confirmDelete)) {
      return;
    }

    const previousCustomFilters = this.boardFilters.currentCustomFilters;
    this.board.customFilters = previousCustomFilters.filter(({ id }) => id !== customFilter.id);
    this.removingFilterIds.add(customFilter.id);
    this.cdRef.markForCheck();

    this.boards.save(this.board)
      .pipe(finalize(() => {
        this.removingFilterIds.delete(customFilter.id);
        this.cdRef.markForCheck();
      }))
      .subscribe({
        next: (board) => {
          this.board = board;
          this.boardFilters.removeCustomFilter(customFilter.id);
          this.toastService.addSuccess(this.text.updateSuccessful);
        },
        error: (error) => {
          this.board.customFilters = previousCustomFilters;
          this.halNotification.handleRawError(error);
        },
      });
  }
}
