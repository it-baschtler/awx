import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { withI18n } from '@lingui/react';
import { t } from '@lingui/macro';
import { func, shape } from 'prop-types';
import { Tooltip } from '@patternfly/react-core';
import { JobTemplatesAPI } from '../../../../../../api';
import { getQSConfig, parseQueryString } from '../../../../../../util/qs';
import useRequest from '../../../../../../util/useRequest';
import PaginatedDataList from '../../../../../../components/PaginatedDataList';
import DataListToolbar from '../../../../../../components/DataListToolbar';
import CheckboxListItem from '../../../../../../components/CheckboxListItem';

const QS_CONFIG = getQSConfig('job-templates', {
  page: 1,
  page_size: 5,
  order_by: 'name',
});

function JobTemplatesList({ i18n, nodeResource, onUpdateNodeResource }) {
  const location = useLocation();

  const {
    result: { jobTemplates, count, relatedSearchableKeys, searchableKeys },
    error,
    isLoading,
    request: fetchJobTemplates,
  } = useRequest(
    useCallback(async () => {
      const params = parseQueryString(QS_CONFIG, location.search);
      const [response, actionsResponse] = await Promise.all([
        JobTemplatesAPI.read(params, {
          role_level: 'execute_role',
        }),
        JobTemplatesAPI.readOptions(),
      ]);
      return {
        jobTemplates: response.data.results,
        count: response.data.count,
        relatedSearchableKeys: (
          actionsResponse?.data?.related_search_fields || []
        ).map(val => val.slice(0, -8)),
        searchableKeys: Object.keys(
          actionsResponse.data.actions?.GET || {}
        ).filter(key => actionsResponse.data.actions?.GET[key].filterable),
      };
    }, [location]),
    {
      jobTemplates: [],
      count: 0,
      relatedSearchableKeys: [],
      searchableKeys: [],
    }
  );

  useEffect(() => {
    fetchJobTemplates();
  }, [fetchJobTemplates]);

  const onSelectRow = row => {
    if (
      row.project &&
      row.project !== null &&
      ((row.inventory && row.inventory !== null) || row.ask_inventory_on_launch)
    ) {
      onUpdateNodeResource(row);
    }
  };

  return (
    <PaginatedDataList
      contentError={error}
      hasContentLoading={isLoading}
      itemCount={count}
      items={jobTemplates}
      onRowClick={row => onSelectRow(row)}
      qsConfig={QS_CONFIG}
      renderItem={item => {
        const isDisabled =
          !item.project ||
          item.project === null ||
          ((!item.inventory || item.inventory === null) &&
            !item.ask_inventory_on_launch);
        const listItem = (
          <CheckboxListItem
            isDisabled={isDisabled}
            isSelected={!!(nodeResource && nodeResource.id === item.id)}
            itemId={item.id}
            key={`${item.id}-listItem`}
            name={item.name}
            label={item.name}
            onSelect={() => onSelectRow(item)}
            onDeselect={() => onUpdateNodeResource(null)}
            isRadio
          />
        );
        return isDisabled ? (
          <Tooltip
            key={`${item.id}-tooltip`}
            content={i18n._(
              t`Job Templates with a missing inventory or project cannot be selected when creating or editing nodes`
            )}
          >
            {listItem}
          </Tooltip>
        ) : (
          listItem
        );
      }}
      renderToolbar={props => <DataListToolbar {...props} fillWidth />}
      showPageSizeOptions={false}
      toolbarSearchColumns={[
        {
          name: i18n._(t`Name`),
          key: 'name__icontains',
          isDefault: true,
        },
        {
          name: i18n._(t`Playbook name`),
          key: 'playbook__icontains',
        },
        {
          name: i18n._(t`Created By (Username)`),
          key: 'created_by__username__icontains',
        },
        {
          name: i18n._(t`Modified By (Username)`),
          key: 'modified_by__username__icontains',
        },
      ]}
      toolbarSortColumns={[
        {
          name: i18n._(t`Name`),
          key: 'name',
        },
      ]}
      toolbarSearchableKeys={searchableKeys}
      toolbarRelatedSearchableKeys={relatedSearchableKeys}
    />
  );
}

JobTemplatesList.propTypes = {
  nodeResource: shape(),
  onUpdateNodeResource: func.isRequired,
};

JobTemplatesList.defaultProps = {
  nodeResource: null,
};

export default withI18n()(JobTemplatesList);
