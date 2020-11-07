"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../api/utils/Utils");
// transform every record (only respond allowed fields and "&fields=" in query)
function transformData(context, query, allowedFields) {
    const queryParams = Utils_1.getPageQuery(query);
    const transformed = {};
    allowedFields.forEach((field) => {
        if (queryParams && queryParams.fields && queryParams.fields.indexOf(field) < 0) {
            return; // if "fields" is set => only include those fields, return if not.
        }
        transformed[field] = context[field];
    });
    return transformed;
}
exports.transformData = transformData;
// example: URL queryString = '&populate=author:_id,firstName&populate=withUrlData:_id,url'
// => queryArray = ['author:_id,firstName', 'withUrlData:_id,url']
// return array of fields we want to populate (MongoDB spec)
const getPopulateArray = (queryArray, allowedFields) => {
    if (!queryArray) {
        return [];
    }
    const ret = [];
    queryArray.map((str) => {
        const arr = str.split(':');
        // only populate fields belong to "allowedFields"
        if (arr && arr.length === 2 && allowedFields.indexOf(arr[0]) >= 0) {
            ret.push({
                path: arr[0],
                select: arr[1].split(',')
            });
        }
    });
    // example of returned array (MongoDB spec):
    // ret = [
    //   {
    //     path: 'author',
    //     select: ['_id', 'firstName', 'lastName', 'category', 'avatarUrl']
    //   }
    // ];
    return ret;
};
const queryPagination = (mongoQuery, query) => {
    const { page = 1, perPage = 30, limit, offset, sort } = Utils_1.getPageQuery(query);
    mongoQuery.sort(sort);
    // 2 ways to have pagination using: offset & limit OR page & perPage
    if (query.perPage) {
        mongoQuery.skip(perPage * (page - 1)).limit(perPage);
    }
    if (typeof offset !== 'undefined') {
        mongoQuery.skip(offset);
    }
    if (typeof limit !== 'undefined') {
        mongoQuery.limit(limit);
    }
};
// list data with pagination support
// return a promise for chaining. (e.g. list then transform)
function listData(context, query, allowedFields) {
    const mongoQueryObj = Utils_1.getMongoQuery(query, allowedFields); // allowed filter fields
    // console.log('--- query: ', query);
    // console.log('--- allowedFields: ', allowedFields);
    // console.log('--- populateArr: ', populateArr);
    let result = context.find(mongoQueryObj);
    queryPagination(result, query);
    const populateArr = getPopulateArray(query.populate, allowedFields);
    populateArr.forEach((item) => {
        result = result.populate(item);
    });
    const execRes = result.exec();
    return Utils_1.queryPromise(execRes);
}
exports.listData = listData;
