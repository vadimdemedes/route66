if (!Array.prototype.includes) {
  Array.prototype.includes = function (value) {
    return this.indexOf(value) > -1;
  };
}
