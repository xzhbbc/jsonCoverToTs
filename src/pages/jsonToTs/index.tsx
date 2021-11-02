import React, { useCallback, useState } from 'react'
import './index.scss'
import { Button, Input, Modal } from 'antd'
import MonacoEditor from 'react-monaco-editor'
import { Utils } from '@/utils/utils'
import lodash from 'lodash'

const options = {
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  automaticLayout: false
}
type CacheWriteItem = {
  itemName: string
  value: any
  preItemName: string
}
let memoCache: CacheWriteItem[] = []
const JsonToTs = () => {
  const [jsonStr, setJson] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const changeCode = useCallback((newVal: string, e: any) => {
    // console.log(newVal, e, 'changeCode')
    setCode(newVal)
  }, [])

  const debounceSet = lodash.debounce(val => setJson(val), 1000)

  const changeJson = useCallback((newVal: string, e: any) => {
    debounceSet(newVal)
  }, [])

  const coverToType = (item: any, key: string) => {
    if (Utils.isCheck(item, 'String')) {
      return 'string'
    } else if (Utils.isCheck(item, 'Number')) {
      return 'number'
    } else if (Utils.isCheck(item, 'Object')) {
      return Utils.upperFirstCase(Utils.toHump(key))
    } else if (Utils.isCheck(item, 'Array')) {
      return `Array<${Utils.upperFirstCase(Utils.toHump(key))}>`
    } else {
      return 'unknown'
    }
  }

  // 使用一个数组，记录写的type
  // 用于去重和重命名
  const checkMemoCacheToFixWrite = (
    itemName: string,
    value: Record<any, any>,
    preItemName: string
  ) => {
    const find = memoCache.find(item => item.itemName === itemName)
    let _itemName = itemName
    if (find) {
      if (lodash.isEqual(find.value, value)) {
        return
      } else {
        // 需要重命名
        memoCache.push({
          itemName: preItemName,
          value,
          preItemName
        })
        _itemName = preItemName
      }
    } else {
      memoCache.push({
        itemName,
        value,
        preItemName
      })
    }
    return _itemName
  }

  const canWriteItem = (
    originStr: string,
    key: string,
    data: Record<any, any>,
    preName: string,
    cacheWrite: CacheWriteItem[] = []
  ) => {
    let str = originStr
    const getItemName = checkMemoCacheToFixWrite(key, data, preName)
    if (getItemName) {
      cacheWrite.push({
        itemName: getItemName,
        value: data,
        preItemName: preName
      })
      str += `\n\t${key}: ${coverToType(data, getItemName)}`
    }
    return {
      str,
      cacheWrite
    }
  }

  const writeItem = (
    originStr: string,
    value: Record<any, any>,
    cacheWrite: CacheWriteItem[] = [],
    preItemName: string
  ) => {
    let str = originStr
    // console.log(preItemName)
    Object.keys(value).map(key => {
      const typeName = Utils.upperFirstCase(Utils.toHump(key))
      // console.log(renameMap, typeName, 'item=====', preItemName)
      const preCombineItemName = preItemName + typeName
      if (Utils.isCheck(value[key], 'Object')) {
        const getWriteData = canWriteItem(
          str,
          key,
          value[key],
          preCombineItemName,
          cacheWrite
        )
        str = getWriteData.str
        cacheWrite.concat(getWriteData.cacheWrite)
      } else if (Utils.isCheck(value[key], 'Array')) {
        if (value[key].length === 0) {
          throw Error('数组，请至少填一个值')
        }
        const getWriteData = canWriteItem(
          str,
          key,
          value[key][0],
          preCombineItemName,
          cacheWrite
        )
        str = getWriteData.str
        cacheWrite.concat(getWriteData.cacheWrite)
      } else {
        str += `\n\t${key}: ${coverToType(value[key], key)}`
      }
    })
    return {
      str,
      cacheWrite
    }
  }

  const writeTsType = (
    originStr: string,
    value: Record<any, any>,
    keyName: string
  ) => {
    let str = originStr
    const cacheWrite: CacheWriteItem[] = []
    const typeName = Utils.upperFirstCase(Utils.toHump(keyName))
    str += `\n\ntype ${typeName} = {`
    const item = writeItem(str, value, [], typeName)
    str = item.str
    console.log(cacheWrite, 'cache')
    str += '\n}'
    return {
      str,
      cacheWrite: item.cacheWrite
    }
  }

  const cover = () => {
    memoCache = []
    if (!jsonStr) {
      Modal.warn({
        title: '请输入json'
      })
    }
    let cacheWrite: CacheWriteItem[] = []
    try {
      const strCoverToJson = JSON.parse(jsonStr)
      const keyName = name ? name : 'Auto'
      let str = `export interface ${keyName} {`
      const itemData = writeItem(str, strCoverToJson, [], keyName)
      str = itemData.str
      cacheWrite = itemData.cacheWrite
      str += '\n}'
      let i = 0
      while (cacheWrite.length != i) {
        const item = cacheWrite[i]
        const writeType = writeTsType(str, item.value, item.itemName)
        if (writeType.cacheWrite.length > 0) {
          cacheWrite = cacheWrite.concat(writeType.cacheWrite)
        }
        str = writeType.str
        i++
      }
      setCode(str)
    } catch (err) {
      Modal.warn({
        title: `解析json出错：${err}`
      })
    }
  }

  return (
    <div className="container">
      <div className="left">
        json
        <MonacoEditor
          language="json"
          theme="vs-dark"
          value={jsonStr}
          options={options}
          onChange={changeJson}
          className="editor"
        />
        <div className="inputList">
          <Input
            placeholder="请输入命名"
            value={name}
            onChange={e => {
              setName(e.target.value)
            }}
          />
          <Button onClick={cover} type="primary">
            转换
          </Button>
        </div>
      </div>
      <div className="right">
        typescript
        <MonacoEditor
          language="typescript"
          theme="vs-dark"
          value={code}
          options={options}
          onChange={changeCode}
        />
      </div>
    </div>
  )
}

export default JsonToTs
