import { CliPage } from './app.po';

describe('cli App', () => {
  let page: CliPage;

  beforeEach(() => {
    page = new CliPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
