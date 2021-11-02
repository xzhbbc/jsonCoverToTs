export class Utils {
  static isCheck(item: any, type: 'String' | 'Array' | 'Object' | 'Number') {
    return toString.call(item) === `[object ${type}]`
  }

  // 下划线转换驼峰
  static toHump(name: string) {
    return name.replace(/\_(\w)/g, function(all, letter){
      return letter.toUpperCase();
    });
  }

  // 驼峰转换下划线
  static toLine(name: string) {
    return name.replace(/([A-Z])/g,"_$1").toLowerCase();
  }

  // 首字母大写
  static upperFirstCase(name: string) {
    return name.slice(0, 1).toUpperCase() + name.slice(1)
  }
}
